"use server";

import { ACCESS_DENIED_ERROR } from "@/lib/errors";
import {
  type GlobalConfig,
  getConfig,
  saveConfig,
} from "@/lib/landing-pages/config";
import {
  DEFAULT_CONFIG,
  normalizeGlobalConfig,
} from "@/lib/landing-pages/global-config";
import { requireLpSession } from "@/lib/session";

/** Lê a configuração global da conta para landing pages. */
export async function getConfigAction(): Promise<GlobalConfig> {
  try {
    await requireLpSession();
  } catch {
    return { ...DEFAULT_CONFIG };
  }
  return getConfig();
}

export type SaveConfigResult = { ok: true } | { ok: false; error: string };

/** Salva a configuração global da conta para landing pages. */
export async function saveConfigAction(
  c: GlobalConfig,
): Promise<SaveConfigResult> {
  try {
    await requireLpSession();
  } catch {
    return { ok: false, error: ACCESS_DENIED_ERROR };
  }

  try {
    await saveConfig(normalizeGlobalConfig(c));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar.",
    };
  }
}
