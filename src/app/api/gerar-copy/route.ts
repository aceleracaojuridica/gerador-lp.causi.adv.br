/*
  Gera a copy da LP (OpenAI + imagens Unsplash) SEM salvar no banco.
  Retorna { copy, images } para o wizard montar o picker de layout.
  O advogado ainda não escolheu layout/variantes — isso acontece no step seguinte.
*/

import type { FocoCopy } from "@/lib/landing-pages/focos";
import { imagensDoTema } from "@/lib/landing-pages/image-bank";
import {
  type CopyPayload,
  callOpenAiForCopy,
} from "@/lib/landing-pages/lp-generate-copy";
import { getPublicMediaUrl } from "@/lib/landing-pages/media-storage";
import { buscarImagensUnsplash } from "@/lib/landing-pages/unsplash";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let session: Session;
  try {
    session = await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return Response.json(
      { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
      { status: forbidden ? 403 : 401 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY não configurada no servidor (.env.local)." },
      { status: 503 },
    );
  }

  let p: CopyPayload;
  try {
    p = (await request.json()) as CopyPayload;
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const tema = (p.tema ?? "").trim();
  if (!tema) {
    return Response.json(
      { error: "Informe o tema da página." },
      { status: 400 },
    );
  }

  let copy: FocoCopy;
  let imageQueries: Record<string, string> = {};
  try {
    const result = await callOpenAiForCopy(apiKey, p);
    copy = result.copy;
    imageQueries = result.imageQueries;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar a copy.";
    return Response.json({ error: msg }, { status: 502 });
  }

  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  // Imagens: Unsplash ao vivo + banco curado como fallback
  const live = await buscarImagensUnsplash(imageQueries);
  const bank = imagensDoTema(tema);

  // Buscar imagens da galeria da conta
  const { data: galleryImages } = await db
    .from("lp_account_images")
    .select("id, storage_path")
    .eq("account_id", ctx.accountId);

  // Buscar usos atuais
  const { data: usages } = await db
    .from("lp_image_usages")
    .select("slot, image_id");

  const usageMap = new Map((usages || []).map((u) => [u.slot, u.image_id]));
  const galleryMap = new Map(
    (galleryImages || []).map((img) => [img.id, img.storage_path]),
  );
  const galleryPaths = (galleryImages || []).map((img) => img.storage_path);

  const getSlotImage = (slot: string, liveUrl: string, bankUrl: string) => {
    // 1. Matched slot
    const matchedImageId = usageMap.get(slot);
    if (matchedImageId) {
      const path = galleryMap.get(matchedImageId);
      if (path) return getPublicMediaUrl(path);
    }
    // 2. Qualquer imagem da galeria (com índice para distribuir)
    if (galleryPaths.length > 0) {
      const slotIndex = ["hero", "dor", "sobre", "solucao"].indexOf(slot);
      const path = galleryPaths[slotIndex % galleryPaths.length];
      return getPublicMediaUrl(path);
    }
    // 3. Unsplash / Banco
    return liveUrl || bankUrl;
  };

  const images = {
    hero: getSlotImage("hero", live.hero, bank.hero),
    dor: getSlotImage("dor", live.dor, bank.dor),
    sobre: getSlotImage("sobre", live.sobre, bank.sobre),
    solucao: getSlotImage("solucao", live.solucao, bank.solucao),
  };

  return Response.json({ copy, images });
}
