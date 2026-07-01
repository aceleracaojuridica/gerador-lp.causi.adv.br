"use server";

import { ACCESS_DENIED_ERROR } from "@/lib/errors";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
  getConfig,
  saveConfig,
} from "@/lib/landing-pages/config";
import { requireLpSession } from "@/lib/session";

/** Lê a configuração global do usuário (Projeto B). */
export async function getConfigAction(): Promise<GlobalConfig> {
  try {
    await requireLpSession();
  } catch {
    return { ...DEFAULT_CONFIG };
  }
  return getConfig();
}

export type SaveConfigResult = { ok: true } | { ok: false; error: string };

/** Salva a configuração global do usuário (Projeto B). */
export async function saveConfigAction(
  c: GlobalConfig,
): Promise<SaveConfigResult> {
  try {
    await requireLpSession();
  } catch {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }

  try {
    await saveConfig({
      fonts: {
        heading: c.fonts?.heading ?? "",
        body: c.fonts?.body ?? "",
      },
      tags: {
        head: c.tags?.head ?? "",
        body: c.tags?.body ?? "",
        footer: c.tags?.footer ?? "",
      },
      domain: c.domain ?? "",
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar.",
    };
  }
}
