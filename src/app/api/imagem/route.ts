import { NextResponse } from "next/server";
import {
  categoriaDoTema,
  imagemAleatoria,
} from "@/lib/landing-pages/image-bank";
import { getPublicMediaUrl } from "@/lib/landing-pages/media-storage";
import { buscarUmaImagem } from "@/lib/landing-pages/unsplash";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";

export const dynamic = "force-dynamic";

// Intenção de cada seção (termos em inglês — Unsplash responde melhor).
const SECTION_INTENT: Record<string, string> = {
  hero: "law office consultation meeting",
  dor: "worried person reading documents",
  sobre: "modern law firm office interior",
  solucao: "lawyer advising client handshake",
};

// Termos da área jurídica (refina a busca conforme o tema).
const AREA_TERMS: Record<string, string> = {
  trabalhista: "worker labor",
  previdenciario: "elderly retirement",
  familia: "family together",
  consumidor: "finance debt bills",
  generico: "law justice professional",
};

const KEYS = ["hero", "dor", "sobre", "solucao"] as const;
type Key = (typeof KEYS)[number];

/**
 * "IA escolhe" imagem: busca no banco de imagens da conta, depois Unsplash, depois banco curado.
 */
export async function POST(req: Request) {
  let session: Session;
  try {
    session = await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return NextResponse.json(
      { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
      { status: forbidden ? 403 : 401 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    tema?: string;
    sectionKey?: string;
    current?: string;
  };
  const tema = body.tema ?? "";
  const key: Key = KEYS.includes(body.sectionKey as Key)
    ? (body.sectionKey as Key)
    : "hero";

  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  let url = null;

  // 1. Prioridade: Imagem da galeria com uso no mesmo slot para esta conta
  const { data: usageMatch } = await db
    .from("lp_image_usages")
    .select("image_id")
    .eq("slot", key)
    .limit(1)
    .maybeSingle();

  if (usageMatch?.image_id) {
    const { data: img } = await db
      .from("lp_account_images")
      .select("storage_path")
      .eq("id", usageMatch.image_id)
      .eq("account_id", ctx.accountId)
      .maybeSingle();

    if (img) {
      url = getPublicMediaUrl(img.storage_path);
    }
  }

  // 2. Prioridade: Qualquer imagem da galeria da conta
  if (!url) {
    const { data: anyImage } = await db
      .from("lp_account_images")
      .select("storage_path")
      .eq("account_id", ctx.accountId)
      .limit(1)
      .maybeSingle();

    if (anyImage) {
      url = getPublicMediaUrl(anyImage.storage_path);
    }
  }

  // 3. Prioridade: Unsplash
  if (!url) {
    const cat = categoriaDoTema(tema);
    const query = `${AREA_TERMS[cat] ?? AREA_TERMS.generico} ${SECTION_INTENT[key]}`;
    url = await buscarUmaImagem(query);
  }

  // 4. Prioridade: Fallback (Banco de imagens local)
  if (!url) {
    url = imagemAleatoria(key, body.current);
  }

  return NextResponse.json({ url });
}
