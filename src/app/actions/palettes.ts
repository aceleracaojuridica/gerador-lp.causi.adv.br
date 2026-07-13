"use server";

import type { Theme } from "@/lib/landing-pages/schema";
import { callOpenAiForSimilarPalette } from "@/lib/landing-pages/sugerir-paletas";
import { themeSchema } from "@/lib/landing-pages/validation/zod-primitives";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

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
  let session: Session;
  try {
    session = await requireLpSession();
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

  const lpCtx = sessionToLpContext(session);
  const log = {
    action: "UPDATE",
    context: "suggest_palette",
    accountId: lpCtx.accountId,
    createdByUserId: lpCtx.userId,
  };

  try {
    const theme = await callOpenAiForSimilarPalette(
      apiKey,
      parsed.data,
      avoid,
      log,
    );
    if (!theme) {
      return {
        ok: false,
        error:
          "A IA não retornou uma paleta válida. Tente novamente em instantes.",
      };
    }
    return { ok: true, theme };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar a IA.";
    return { ok: false, error: msg };
  }
}
