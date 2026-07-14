import "server-only";

/*
  Contexto leve das LPs da conta para grounding na geração.
  Envia à LLM somente URL pública + descrição semântica (tema/SEO).
  Nunca injeta schema, variants ou copy de seções.
*/

import type { Session } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { publicLpUrl } from "./lp-url";

/** Teto de exemplos (~14 linhas) ou de caracteres — o que vier primeiro. */
const MAX_EXAMPLES = 14;
const MAX_PROMPT_CHARS = 2800;

export type AccountLpExample = {
  url: string;
  name: string;
  tema: string;
  status: string;
  summary: string;
};

type SeoSlice = {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
};

type LpContextRow = {
  slug: string;
  office_subdomain: string;
  name: string | null;
  tema: string | null;
  status: string | null;
  schema: { seo?: SeoSlice } | null;
  updated_at: string | null;
};

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Score simples de sobreposição de tokens entre o tema atual e o tema da LP. */
function temaSimilarity(currentTema: string, candidateTema: string): number {
  const a = normalizeText(currentTema);
  const b = normalizeText(candidateTema);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 80;

  const tokensA = new Set(a.split(/[^a-z0-9]+/).filter((t) => t.length > 2));
  const tokensB = b.split(/[^a-z0-9]+/).filter((t) => t.length > 2);
  if (tokensA.size === 0 || tokensB.length === 0) return 0;

  let hits = 0;
  for (const t of tokensB) {
    if (tokensA.has(t)) hits += 1;
  }
  return Math.round((hits / Math.max(tokensA.size, tokensB.length)) * 60);
}

function extractSemanticSummary(
  tema: string,
  name: string,
  seo: SeoSlice | undefined,
): string {
  const title = (seo?.ogTitle || seo?.title || "").trim();
  const description = (seo?.ogDescription || seo?.description || "").trim();
  const parts = [title, description].filter(Boolean);
  if (parts.length === 0) {
    return tema && name && name !== tema ? `${tema}. ${name}` : tema || name;
  }
  return parts.join(" — ").slice(0, 220);
}

/**
 * Formata exemplos leves da conta para o prompt (URL + tema + resumo SEO).
 * Respeita teto de exemplos e de caracteres.
 */
export function formatAccountLpExamplesForPrompt(
  examples: AccountLpExample[],
): string {
  if (examples.length === 0) return "";

  const lines: string[] = [];
  let used = 0;

  for (const example of examples.slice(0, MAX_EXAMPLES)) {
    const line = `- url: ${example.url} | tema: ${example.tema || "(sem tema)"} | resumo: ${example.summary || "(sem resumo)"} | status: ${example.status}`;
    if (used + line.length + 1 > MAX_PROMPT_CHARS) break;
    lines.push(line);
    used += line.length + 1;
  }

  if (lines.length === 0) return "";

  return [
    "PORTFÓLIO DO ESCRITÓRIO (somente URL + descrição semântica — NÃO copie texto destas páginas):",
    ...lines,
  ].join("\n");
}

/**
 * Carrega LPs da conta (draft + published) e devolve bloco curto para o prompt.
 * Prioriza temas semelhantes ao atual; completa com as mais recentes.
 */
export async function loadAccountLpExamplesForPrompt(
  session: Session,
  currentTema: string,
): Promise<string> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data, error } = await db
    .from("landing_pages")
    .select("slug,office_subdomain,name,tema,status,schema,updated_at")
    .eq("account_id", ctx.accountId)
    .in("status", ["draft", "published"])
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    throw Object.assign(new Error(error.message), { code: error.code });
  }
  if (!data?.length) return "";

  const scored = new Map<string, number>();
  const examples: AccountLpExample[] = [];

  for (const row of data as LpContextRow[]) {
    const slug = row.slug?.trim();
    const subdomain = row.office_subdomain?.trim();
    if (!slug || !subdomain) continue;

    const name = (row.name || slug).trim();
    const tema = (row.tema || "").trim();
    const url = publicLpUrl(subdomain, slug);
    const seo = row.schema?.seo;
    const summary = extractSemanticSummary(tema, name, seo);

    examples.push({
      url,
      name,
      tema,
      status: row.status === "published" ? "published" : "draft",
      summary,
    });
    scored.set(url, temaSimilarity(currentTema, tema));
  }

  const ranked = [...examples].sort(
    (left, right) => (scored.get(right.url) ?? 0) - (scored.get(left.url) ?? 0),
  );
  return formatAccountLpExamplesForPrompt(ranked);
}
