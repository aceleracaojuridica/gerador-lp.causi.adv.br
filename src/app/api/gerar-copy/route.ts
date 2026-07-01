/*
  Gera a copy da LP (OpenAI + imagens Unsplash) SEM salvar no banco.
  Retorna { copy, images } para o wizard montar o picker de layout.
  O advogado ainda não escolheu layout/variantes — isso acontece no step seguinte.
*/
import { imagensDoTema } from "@/lib/landing-pages/image-bank";
import {
  type CopyPayload,
  callOpenAiForCopy,
} from "@/lib/landing-pages/lp-generate-copy";
import { buscarImagensUnsplash } from "@/lib/landing-pages/unsplash";
import { requireLpSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireLpSession();
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

  let copy;
  let imageQueries: Record<string, string> = {};
  try {
    const result = await callOpenAiForCopy(apiKey, p);
    copy = result.copy;
    imageQueries = result.imageQueries;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao gerar a copy.";
    return Response.json({ error: msg }, { status: 502 });
  }

  // Imagens: Unsplash ao vivo + banco curado como fallback
  const live = await buscarImagensUnsplash(imageQueries);
  const bank = imagensDoTema(tema);
  const images = {
    hero: live.hero || bank.hero,
    dor: live.dor || bank.dor,
    sobre: live.sobre || bank.sobre,
    solucao: live.solucao || bank.solucao,
  };

  return Response.json({ copy, images });
}
