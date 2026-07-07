"use server";

import { ACCESS_DENIED_ERROR } from "@/lib/errors";
import {
  type GlobalConfig,
  getConfig,
  saveConfig,
} from "@/lib/landing-pages/config";
import { DEFAULT_CONFIG } from "@/lib/landing-pages/global-config";
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
      tracking: {
        ga4MeasurementId: c.tracking?.ga4MeasurementId ?? "",
        gtmContainerId: c.tracking?.gtmContainerId ?? "",
        metaPixelId: c.tracking?.metaPixelId ?? "",
        googleAdsId: c.tracking?.googleAdsId ?? "",
        googleAdsLabel: c.tracking?.googleAdsLabel ?? "",
      },
      captcha: {
        provider: c.captcha?.provider ?? "none",
        siteKey: c.captcha?.siteKey ?? "",
        widgetTheme: c.captcha?.widgetTheme ?? "auto",
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
