import { NextResponse } from "next/server";
import { imagemAleatoria } from "@/lib/landing-pages/image-bank";
import { buscarImagemAleatoria } from "@/lib/landing-pages/unsplash";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

export const dynamic = "force-dynamic";

// Intenção de cada seção (termos em inglês — Unsplash responde melhor).
const SECTION_INTENT: Record<string, string> = {
  hero: "law office professional consultation",
  dor: "worried person stressed documents problem",
  sobre: "modern law firm office interior",
  solucao: "lawyer advising client handshake success",
};

// Termos da área jurídica (refina a busca conforme o tema).
const AREA_TERMS: Record<string, string> = {
  trabalhista: "worker labor employment",
  previdenciario: "elderly retirement social security",
  familia: "family together home",
  consumidor: "finance debt consumer",
  generico: "law justice professional",
};

const KEYS = ["hero", "dor", "sobre", "solucao"] as const;
type Key = (typeof KEYS)[number];

function categoriaDoTema(tema: string): string {
  const t = (tema || "").toLowerCase();
  if (
    ["trabalh", "clt", "rescis", "demiss", "hora extra", "fgts"].some((k) =>
      t.includes(k),
    )
  )
    return "trabalhista";
  if (
    [
      "previden",
      "inss",
      "aposentad",
      "auxílio",
      "auxilio",
      "benefíci",
      "benefici",
    ].some((k) => t.includes(k))
  )
    return "previdenciario";
  if (
    [
      "famíli",
      "famili",
      "divórc",
      "divorc",
      "guarda",
      "pensão",
      "aliment",
    ].some((k) => t.includes(k))
  )
    return "familia";
  if (
    [
      "consumidor",
      "negativ",
      "dívida",
      "divida",
      "banco",
      "abusiv",
      "contrato",
    ].some((k) => t.includes(k))
  )
    return "consumidor";
  return "generico";
}

/**
 * "IA escolhe" imagem no editor: usa exclusivamente o endpoint /photos/random
 * da Unsplash para garantir uma foto diferente a cada clique.
 * Fallback: banco de imagens local curado.
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

  const lpCtx = sessionToLpContext(session);
  const log = {
    action: "UPDATE",
    context: "edit_landing_page",
    accountId: lpCtx.accountId,
    createdByUserId: lpCtx.userId,
  };

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

  console.log("[imagem] key:", key, "| tema:", tema, "| cat:", cat);
  console.log("[imagem] query Unsplash:", query);
  console.log("[imagem] current:", body.current);

  // Unsplash /photos/random — retorna uma foto diferente a cada chamada.
  let url = await buscarImagemAleatoria(query, log);

  // Se por acaso caiu na mesma imagem (improvável com random), tenta mais uma vez.
  if (url && url === body.current) {
    console.log("[imagem] mesma imagem, tentando novamente...");
    url = await buscarImagemAleatoria(query, log);
  }

  // Fallback: banco de imagens local curado (garante algo mesmo sem API key).
  if (!url) {
    console.log("[imagem] Unsplash vazio, usando banco local");
    url = imagemAleatoria(key, body.current);
  }

  console.log("[imagem] url final:", url);
  return NextResponse.json({ url });
}
