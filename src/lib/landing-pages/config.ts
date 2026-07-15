import "server-only";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
  normalizeGlobalConfig,
} from "@/lib/landing-pages/global-config";
import { revalidateLpMarketingCache } from "@/lib/landing-pages/lp-public-cache";
import type { SocialNetwork } from "@/lib/landing-pages/schema";
import { normalizeTracking } from "@/lib/landing-pages/tracking";
import { getSession } from "@/lib/session";
import {
  createLpServiceClient,
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";

export type { GlobalConfig } from "@/lib/landing-pages/global-config";

/** Limite total dos snippets custom (head+body+footer) em caracteres. */
const MAX_TRACKING_SCRIPTS_CHARS = 100_000;

type AccountSettingsRow = {
  heading_font: string | null;
  body_font: string | null;
  tracking_scripts: Partial<GlobalConfig["tags"]> | null;
  tracking_providers: Partial<GlobalConfig["tracking"]> | null;
};

type LpAccountSocialRow = {
  network: SocialNetwork;
  url: string;
};

type LpAccountSocialIdRow = {
  id: string;
  network: SocialNetwork;
};

function mapSettingsToMarketingConfig(
  data: AccountSettingsRow | null,
): GlobalConfig {
  return normalizeGlobalConfig({
    fonts: data
      ? {
          heading: data.heading_font ?? "",
          body: data.body_font ?? "",
        }
      : undefined,
    tags: data
      ? { ...DEFAULT_CONFIG.tags, ...(data.tracking_scripts ?? {}) }
      : undefined,
    tracking: normalizeTracking(
      data?.tracking_providers as Parameters<typeof normalizeTracking>[0],
    ),
  });
}

/**
 * Padrão de marketing da conta para LP publicada (anon não tem RLS).
 * Lê apenas tracking via service role — IDs/scripts não são segredos.
 */
export async function getAccountMarketingConfigByAccountId(
  accountId: number,
): Promise<GlobalConfig> {
  if (!Number.isFinite(accountId) || accountId <= 0) {
    return { ...DEFAULT_CONFIG };
  }

  const db = createLpServiceClient();
  const { data } = await db
    .from("lp_account_settings")
    .select("heading_font,body_font,tracking_scripts,tracking_providers")
    .eq("account_id", accountId)
    .maybeSingle<AccountSettingsRow>();

  return mapSettingsToMarketingConfig(data);
}

function assertTrackingScriptsSize(tags: GlobalConfig["tags"]): void {
  const total =
    (tags.head?.length ?? 0) +
    (tags.body?.length ?? 0) +
    (tags.footer?.length ?? 0);
  if (total > MAX_TRACKING_SCRIPTS_CHARS) {
    throw new Error(
      `Scripts customizados excedem o limite de ${MAX_TRACKING_SCRIPTS_CHARS.toLocaleString("pt-BR")} caracteres.`,
    );
  }
}

export async function getConfig(): Promise<GlobalConfig> {
  const session = await getSession();
  if (!session) return { ...DEFAULT_CONFIG };
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data } = await db
    .from("lp_account_settings")
    .select("heading_font,body_font,tracking_scripts,tracking_providers")
    .eq("account_id", ctx.accountId)
    .maybeSingle<AccountSettingsRow>();

  const { data: addressData } = await db
    .from("lp_account_addresses")
    .select("address, cidade, uf, maps_url")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: contactData } = await db
    .from("lp_account_contacts")
    .select("whatsapp, whatsapp_display, email")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", true)
    .maybeSingle();

  const { data: socialsData } = await db
    .from("lp_account_socials")
    .select("network, url")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", true)
    .returns<LpAccountSocialRow[]>();

  const baseConfig = mapSettingsToMarketingConfig(data);

  return {
    ...baseConfig,
    address: addressData
      ? {
          address: addressData.address,
          cidade: addressData.cidade,
          uf: addressData.uf,
          mapsUrl: addressData.maps_url ?? "",
        }
      : undefined,
    contact: contactData
      ? {
          whatsapp: contactData.whatsapp,
          whatsappDisplay: contactData.whatsapp_display,
          email: contactData.email,
        }
      : undefined,
    socials: socialsData
      ? socialsData.map((s) => ({
          network: s.network,
          url: s.url,
        }))
      : [],
  };
}

export async function saveConfig(c: GlobalConfig): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const normalized = normalizeGlobalConfig(c);
  assertTrackingScriptsSize(normalized.tags);

  const { error } = await db.from("lp_account_settings").upsert(
    {
      account_id: ctx.accountId,
      updated_by_user_id: session.user.id,
      heading_font: normalized.fonts.heading,
      body_font: normalized.fonts.body,
      tracking_scripts: normalized.tags,
      tracking_providers: normalized.tracking,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id" },
  );
  if (error) throw new Error(error.message);

  // Salvar Endereço Primário
  if (normalized.address) {
    const { data: existingAddr } = await db
      .from("lp_account_addresses")
      .select("id")
      .eq("account_id", ctx.accountId)
      .eq("is_primary", true)
      .maybeSingle();

    if (existingAddr) {
      await db
        .from("lp_account_addresses")
        .update({
          address: normalized.address.address,
          cidade: normalized.address.cidade,
          uf: normalized.address.uf,
          maps_url: normalized.address.mapsUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAddr.id);
    } else {
      await db.from("lp_account_addresses").insert({
        account_id: ctx.accountId,
        address: normalized.address.address,
        cidade: normalized.address.cidade,
        uf: normalized.address.uf,
        maps_url: normalized.address.mapsUrl,
        is_primary: true,
      });
    }
  }

  // Salvar Contato Primário
  if (normalized.contact) {
    const { data: existingContact } = await db
      .from("lp_account_contacts")
      .select("id")
      .eq("account_id", ctx.accountId)
      .eq("is_primary", true)
      .maybeSingle();

    if (existingContact) {
      await db
        .from("lp_account_contacts")
        .update({
          whatsapp: normalized.contact.whatsapp,
          whatsapp_display: normalized.contact.whatsappDisplay,
          email: normalized.contact.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingContact.id);
    } else {
      await db.from("lp_account_contacts").insert({
        account_id: ctx.accountId,
        whatsapp: normalized.contact.whatsapp,
        whatsapp_display: normalized.contact.whatsappDisplay,
        email: normalized.contact.email,
        is_primary: true,
      });
    }
  }

  // Salvar Redes Sociais Primárias
  if (normalized.socials) {
    const { data: existingSocials } = await db
      .from("lp_account_socials")
      .select("id, network")
      .eq("account_id", ctx.accountId)
      .eq("is_primary", true)
      .returns<LpAccountSocialIdRow[]>();

    const existingMap = new Map(
      (existingSocials ?? []).map((s) => [s.network, s.id]),
    );
    const incomingNetworks = new Set(normalized.socials.map((s) => s.network));

    for (const social of normalized.socials) {
      const existingId = existingMap.get(social.network);
      if (existingId) {
        await db
          .from("lp_account_socials")
          .update({
            url: social.url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingId);
      } else {
        await db.from("lp_account_socials").insert({
          account_id: ctx.accountId,
          network: social.network,
          url: social.url,
          is_primary: true,
        });
      }
    }

    const toDeleteIds = (existingSocials ?? [])
      .filter((s) => !incomingNetworks.has(s.network))
      .map((s) => s.id);

    if (toDeleteIds.length > 0) {
      await db.from("lp_account_socials").delete().in("id", toDeleteIds);
    }
  }

  revalidateLpMarketingCache(ctx.accountId);
}
