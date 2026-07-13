"use server";

import type { Theme } from "@/lib/landing-pages/schema";
import { callOpenAiForSimilarPalette } from "@/lib/landing-pages/sugerir-paletas";
import { themeSchema } from "@/lib/landing-pages/validation/zod-primitives";
import { requireLpSession } from "@/lib/session";

export type SuggestSimilarPaletteResult =
  | { ok: true; theme: Theme }
  | { ok: false; error: string };

/**
 * Gera 1 Theme semelhante à base (cores extraídas da logo), distinto de
 * `avoidTheme` quando informado. Exige sessão do gerador de LP.
 */
export async function suggestSimilarPaletteAction(
  baseTheme: unknown,
  avoidTheme?: unknown,
): Promise<SuggestSimilarPaletteResult> {
  try {
    await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return {
      ok: false,
      error: forbidden ? "Sem acesso ao gerador." : "Não autenticado.",
    };
  }

  const parsed = themeSchema.safeParse(baseTheme);
  if (!parsed.success) {
    return { ok: false, error: "Paleta base inválida." };
  }

  const avoidParsed = themeSchema.safeParse(avoidTheme);
  const avoid = avoidParsed.success ? avoidParsed.data : undefined;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "OPENAI_API_KEY não configurada no servidor (.env.local).",
    };
  }

  try {
    const theme = await callOpenAiForSimilarPalette(apiKey, parsed.data, avoid);
    if (!theme) {
      return { ok: false, error: "A IA não retornou uma paleta válida." };
    }
    return { ok: true, theme };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar a IA.";
    return { ok: false, error: msg };
  }
}
