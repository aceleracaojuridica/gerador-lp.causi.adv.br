import { NextResponse } from "next/server";
import { categoriaDoTema, imagemAleatoria } from "@/lib/landing-pages/image-bank";
import { buscarUmaImagem } from "@/lib/landing-pages/unsplash";
import { requireLpSession } from "@/lib/session";

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
 * "IA escolhe" imagem: busca no Unsplash uma foto aleatória relacionada ao tema
 * + seção. Sem chave/resultado, cai no banco curado (imagensDoTema).
 */
export async function POST(req: Request) {
  try {
    await requireLpSession();
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

  const cat = categoriaDoTema(tema);
  const query = `${AREA_TERMS[cat] ?? AREA_TERMS.generico} ${SECTION_INTENT[key]}`;

  let url = await buscarUmaImagem(query);
  // Fallback (sem chave Unsplash): sorteia do pool, evitando repetir a atual.
  if (!url) url = imagemAleatoria(key, body.current);

  return NextResponse.json({ url });
}
