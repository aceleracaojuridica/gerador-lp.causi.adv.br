/*
  Gera a copy da LP SEM salvar no banco.
  Retorna { copy, images, layout } para o wizard montar a LP.
*/

import type { FocoCopy } from "@/lib/landing-pages/focos";
import { imagensDoTema } from "@/lib/landing-pages/image-bank";
import {
  type CopyPayload,
  callOpenAiForCopy,
} from "@/lib/landing-pages/lp-generate-copy";
import { chooseLayoutWithAi } from "@/lib/landing-pages/lp-generate-layout";
import {
  DEFAULT_THEME,
  type Layout,
  type Theme,
} from "@/lib/landing-pages/schema";
import {
  describeThemeMood,
  listAccountImagesForRanking,
  listSystemGalleryImages,
  pickSystemImagesWithAiRanking,
} from "@/lib/landing-pages/system-default-images";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

export const runtime = "nodejs";

type GerarCopyBody = CopyPayload & {
  theme?: Theme;
  lawyerCount?: number;
  videoId?: string;
  hasMetrics?: boolean;
};

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

  let p: GerarCopyBody;
  try {
    p = (await request.json()) as GerarCopyBody;
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

  const theme = p.theme ?? DEFAULT_THEME;
  const lawyerCount = Math.max(0, p.lawyerCount ?? 0);
  const videoId = (p.videoId ?? "").trim();
  const layoutInput = {
    tema,
    about: (p.about ?? "").trim() || undefined,
    theme,
    lawyerCount,
    hasVideo: Boolean(videoId),
    hasMetrics: Boolean(p.hasMetrics),
  };

  let copy: FocoCopy;
  let layout: Layout;
  let layoutSource: "ai" | "fallback" = "ai";
  try {
    const [copyResult, chosenLayout] = await Promise.all([
      callOpenAiForCopy(apiKey, p),
      chooseLayoutWithAi(apiKey, layoutInput),
    ]);
    copy = copyResult.copy;
    layout = chosenLayout.layout;
    layoutSource = chosenLayout.source;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar a copy.";
    return Response.json({ error: msg }, { status: 502 });
  }

  const ctx = sessionToLpContext(session);
  const paletteHint = describeThemeMood(theme);

  // Pool de candidatos por seção: catálogo global do sistema + galeria da
  // PRÓPRIA conta (nunca de outra conta — escopo em listAccountImagesForRanking).
  // Sem prioridade fixa de origem: a IA escolhe entre todos os elegíveis.
  const [systemCatalog, accountCatalog] = await Promise.all([
    listSystemGalleryImages(session),
    listAccountImagesForRanking(session),
  ]);
  const catalog = [...accountCatalog, ...systemCatalog];

  const picked = await pickSystemImagesWithAiRanking({
    apiKey,
    theme: tema,
    paletteHint,
    catalog,
    seedInput: `${ctx.accountId}:${new Date().toISOString().slice(0, 16)}`,
  });

  // Só cai no banco curado (Unsplash) quando não há nenhum candidato próprio
  // (conta + sistema) para a seção.
  const bank = imagensDoTema(tema);
  const images = {
    hero: picked.hero || bank.hero,
    dor: picked.dor || bank.dor,
    sobre: picked.sobre || bank.sobre,
    solucao: picked.solucao || bank.solucao,
  };

  const response: Record<string, unknown> = { copy, images, layout };
  if (process.env.NODE_ENV === "development") {
    response._layoutSource = layoutSource;
  }
  return Response.json(response);
}
