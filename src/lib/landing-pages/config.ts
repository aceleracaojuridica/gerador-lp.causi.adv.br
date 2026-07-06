/*
  Configuração GLOBAL por conta (`account_id`). Vale como padrão para todas
  as LPs da conta: tipografia, tracking, snippets e domínio.
*/
import "server-only";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
  normalizeGlobalConfig,
} from "@/lib/landing-pages/global-config";
import { getSession } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";

export type { GlobalConfig } from "@/lib/landing-pages/global-config";

type AccountSettingsRow = {
  heading_font: string | null;
  body_font: string | null;
  tracking_scripts: Partial<GlobalConfig["tags"]> | null;
  tracking_providers: Partial<GlobalConfig["tracking"]> | null;
  captcha_config: Partial<GlobalConfig["captcha"]> | null;
  custom_domain: string | null;
};

export async function getConfig(): Promise<GlobalConfig> {
  const session = await getSession();
  if (!session) return { ...DEFAULT_CONFIG };
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data } = await db
    .from("lp_account_settings")
    .select(
      "heading_font,body_font,tracking_scripts,tracking_providers,captcha_config,custom_domain",
    )
    .eq("account_id", ctx.accountId)
    .maybeSingle<AccountSettingsRow>();

  if (!data) return { ...DEFAULT_CONFIG };
  return normalizeGlobalConfig({
    fonts: {
      heading: data.heading_font ?? "",
      body: data.body_font ?? "",
    },
    tags: { ...DEFAULT_CONFIG.tags, ...(data.tracking_scripts ?? {}) },
    tracking: {
      ...DEFAULT_CONFIG.tracking,
      ...(data.tracking_providers ?? {}),
    },
    captcha: {
      ...DEFAULT_CONFIG.captcha,
      ...(data.captcha_config ?? {}),
    },
    domain: data.custom_domain ?? "",
  });
}

export async function saveConfig(c: GlobalConfig): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const normalized = normalizeGlobalConfig(c);

  const { error } = await db.from("lp_account_settings").upsert(
    {
      account_id: ctx.accountId,
      updated_by_user_id: session.user.id,
      heading_font: normalized.fonts.heading,
      body_font: normalized.fonts.body,
      tracking_scripts: normalized.tags,
      tracking_providers: normalized.tracking,
      captcha_config: normalized.captcha,
      custom_domain: normalized.domain,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id" },
  );
  if (error) throw new Error(error.message);
}
