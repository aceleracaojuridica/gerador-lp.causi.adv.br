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
};

export async function getConfig(): Promise<GlobalConfig> {
  const session = await getSession();
  if (!session) return { ...DEFAULT_CONFIG };
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data } = await db
    .from("lp_account_settings")
    .select(
      "heading_font,body_font,tracking_scripts,tracking_providers,captcha_config",
    )
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
    .eq("is_primary", true);

  const baseConfig = normalizeGlobalConfig({
    fonts: data
      ? {
          heading: data.heading_font ?? "",
          body: data.body_font ?? "",
        }
      : undefined,
    tags: data
      ? { ...DEFAULT_CONFIG.tags, ...(data.tracking_scripts ?? {}) }
      : undefined,
    tracking: data
      ? {
          ...DEFAULT_CONFIG.tracking,
          ...(data.tracking_providers ?? {}),
        }
      : undefined,
    captcha: data
      ? {
          ...DEFAULT_CONFIG.captcha,
          ...(data.captcha_config ?? {}),
        }
      : undefined,
  });

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
      ? socialsData.map((s: any) => ({
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

  const { error } = await db.from("lp_account_settings").upsert(
    {
      account_id: ctx.accountId,
      updated_by_user_id: session.user.id,
      heading_font: normalized.fonts.heading,
      body_font: normalized.fonts.body,
      tracking_scripts: normalized.tags,
      tracking_providers: normalized.tracking,
      captcha_config: normalized.captcha,
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
      .eq("is_primary", true);

    const existingMap = new Map(
      (existingSocials ?? []).map((s: any) => [s.network, s.id]),
    );
    const incomingNetworks = new Set(normalized.socials.map((s) => s.network));

    // Upsert das que foram recebidas
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

    // Delete das que não vieram no payload
    const toDeleteIds = (existingSocials ?? [])
      .filter((s: any) => !incomingNetworks.has(s.network))
      .map((s: any) => s.id);

    if (toDeleteIds.length > 0) {
      await db.from("lp_account_socials").delete().in("id", toDeleteIds);
    }
  }
}
