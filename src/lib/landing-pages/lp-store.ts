import "server-only";

import {
  ensureLpAccount,
  getLpAccount,
  isBackfillOfficeSubdomain,
  provisionOfficeSubdomainIfNeeded,
} from "@/lib/landing-pages/account-store";
import type { Session } from "@/lib/session/types";
import type { LpDbClient } from "@/lib/supabase/lp-client";
import {
  createLpAnonClient,
  createLpUserClient,
  type LpContext,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { GENERIC_ETAPAS } from "./focos";
import { deleteOrphanedImages } from "./gallery-cleanup";
import { syncImageUsagesFromSchema } from "./image-usages";
import { buildLpListPreview, type LpListPreview } from "./lp-preview";
import { persistLpSchemaMedia } from "./media-storage";
import type { LpSchema, StoredLp } from "./schema";
import { DEFAULT_LAYOUT } from "./schema";
import { normalizeSeo } from "./seo";
import {
  HERO_VARIANT_VIDEO_FALLBACK,
  isLegacyHeroVideoVariant,
  normalizeAreasVariant,
  normalizeDorVariant,
  normalizeEquipeVariant,
  normalizeEtapasVariant,
  normalizeHeroVariant,
  normalizeSobreVariant,
  normalizeSolucaoVariant,
  SOBRE_VARIANT_OVERLAY_PORTRAIT,
} from "./variants";
import { buildVideoSection, orderWithVideoFirst } from "./video-section";

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LandingPageRow = {
  id: string;
  slug: string;
  office_subdomain: string;
  name: string;
  tema: string;
  status: "draft" | "published";
  schema: StoredLp["schema"];
  created_by_user_id: string;
  causi_user_id: string;
};

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

/** Verifica se um slug de LP já está em uso na conta. */
export async function isLpSlugTaken(
  session: Session,
  slug: string,
): Promise<boolean> {
  const safe = safeSlug(slug);
  if (!safe) return true;
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const { data } = await db
    .from("landing_pages")
    .select("id")
    .eq("slug", safe)
    .eq("account_id", ctx.accountId)
    .maybeSingle();
  return !!data;
}

/**
 * Subdomínio fixo do escritório (derivado do slug da conta no Causi).
 * Persistido em `lp_accounts`; provisionado no primeiro acesso via `ensureLpAccount`.
 */
export async function resolveOfficeSubdomain(
  session: Session,
): Promise<string> {
  await ensureLpAccount(session);
  const account = await getLpAccount(session);

  const current = account?.office_subdomain?.trim();
  if (current && !isBackfillOfficeSubdomain(current)) {
    return current;
  }

  await provisionOfficeSubdomainIfNeeded(session);
  const refreshed = await getLpAccount(session);
  const subdomain = refreshed?.office_subdomain?.trim();
  if (subdomain && !isBackfillOfficeSubdomain(subdomain)) {
    return subdomain;
  }

  throw new Error("subdomain-conflict");
}

async function resolveProfileId(
  db: LpDbClient,
  causiUserId: string,
): Promise<string | null> {
  if (!UUID_RE.test(causiUserId)) return null;
  const { data } = await db
    .from("profiles")
    .select("id")
    .eq("id", causiUserId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** Item resumido da galeria de LPs. */
export type LpListItem = {
  slug: string;
  officeSubdomain: string;
  name: string;
  tema: string;
  status: "draft" | "published";
  preview: LpListPreview;
  updatedAt: string | null;
  createdAt: string | null;
  createdByUserId: string;
};

/** Lista resumida das LPs da conta (para a galeria). */
export async function listLps(session: Session): Promise<LpListItem[]> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("landing_pages")
    .select(
      "slug,office_subdomain,name,tema,status,schema,updated_at,created_at,created_by_user_id",
    )
    .eq("account_id", ctx.accountId)
    .order("updated_at", { ascending: false });
  if (error) throwDbError(error);
  if (!data) return [];

  return (
    data as Pick<
      LandingPageRow,
      | "slug"
      | "office_subdomain"
      | "name"
      | "tema"
      | "status"
      | "schema"
      | "created_by_user_id"
    >[]
  ).map((r) => {
    const slug = r.slug;
    const officeSubdomain = r.office_subdomain;
    const name = r.name || slug;
    const tema = r.tema || "";
    const schema = r.schema as LpSchema | null;

    return {
      slug,
      officeSubdomain,
      name,
      tema,
      status: r.status ?? "draft",
      preview: buildLpListPreview({
        schema,
        officeSubdomain,
        slug,
        tema,
        name,
      }),
      updatedAt: (r as { updated_at?: string | null }).updated_at ?? null,
      createdAt: (r as { created_at?: string | null }).created_at ?? null,
      createdByUserId: r.created_by_user_id,
    };
  });
}

/** Carrega metadados da LP (sem schema) para checagem de permissão. */
export async function getLpMeta(
  session: Session,
  slug: string,
): Promise<{
  id: string;
  slug: string;
  createdByUserId: string;
} | null> {
  const safe = safeSlug(slug);
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("landing_pages")
    .select("id,slug,created_by_user_id")
    .eq("slug", safe)
    .maybeSingle();
  if (error) throwDbError(error);
  if (!data) return null;
  return {
    id: data.id as string,
    slug: data.slug as string,
    createdByUserId: data.created_by_user_id as string,
  };
}

/** Carrega uma LP completa pelo slug (conta ativa). */
export async function getLp(
  session: Session,
  slug: string,
): Promise<StoredLp | null> {
  const safe = safeSlug(slug);
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("landing_pages")
    .select("slug,office_subdomain,name,tema,status,schema")
    .eq("slug", safe)
    .maybeSingle();
  if (error) throwDbError(error);
  if (!data) return null;
  const row = data as LandingPageRow;
  return migrate({
    slug: row.slug,
    officeSubdomain: row.office_subdomain,
    name: row.name,
    tema: row.tema ?? "",
    status: row.status ?? "draft",
    schema: row.schema,
  });
}

/** Salva (cria ou sobrescreve) uma LP da conta. */
export async function saveLp(session: Session, lp: StoredLp): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const safe = safeSlug(lp.slug);
  if (!safe) throw new Error("slug inválido");

  const { data: conflict } = await db
    .from("landing_pages")
    .select("id,account_id,created_by_user_id")
    .eq("slug", safe)
    .eq("account_id", ctx.accountId)
    .maybeSingle();

  const officeSubdomain =
    lp.officeSubdomain?.trim() || (await resolveOfficeSubdomain(session));

  const schema = await persistLpSchemaMedia(lp.schema, {
    session,
    officeSubdomain,
    userId: ctx.userId,
    accountId: ctx.accountId,
    slug: safe,
  });

  const profileId = await resolveProfileId(db, ctx.userId);
  const row = {
    causi_user_id: ctx.userId,
    account_id: ctx.accountId,
    created_by_user_id: conflict
      ? (conflict.created_by_user_id as string)
      : ctx.userId,
    profile_id: profileId,
    office_subdomain: officeSubdomain,
    slug: safe,
    name: lp.name ?? "",
    tema: lp.tema ?? "",
    status: lp.status ?? "draft",
    schema,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await db
    .from("landing_pages")
    .upsert(row, { onConflict: "account_id,slug" })
    .select("id")
    .single();
  if (error) throwDbError(error);

  await syncImageUsagesFromSchema(db, saved.id as string, schema);

  // Sincronizar contatos, endereços e redes sociais para reutilização global
  if (schema?.office) {
    const office = schema.office;

    // 1. Sincronizar contato principal
    if (office.whatsapp || office.email) {
      const whatsapp = office.whatsapp ?? "";
      const email = (office.email ?? "").trim();
      const whatsappDisplay = office.whatsappDisplay ?? "";

      const { data: existingContact } = await db
        .from("lp_account_contacts")
        .select("id")
        .eq("account_id", ctx.accountId)
        .eq("whatsapp", whatsapp)
        .eq("email", email)
        .maybeSingle();

      if (!existingContact) {
        await db.from("lp_account_contacts").insert({
          account_id: ctx.accountId,
          whatsapp,
          whatsapp_display: whatsappDisplay,
          email,
          is_primary: false, // O trigger do banco cuidará de promover para true se for o único/primeiro
        });
      }
    }

    // Sincronizar contatos extras
    if (Array.isArray(office.extraContacts)) {
      for (const c of office.extraContacts) {
        if (c.whatsapp || c.email) {
          const whatsapp = c.whatsapp ?? "";
          const email = (c.email ?? "").trim();
          const whatsappDisplay = c.whatsappDisplay ?? "";

          const { data: existingExtraContact } = await db
            .from("lp_account_contacts")
            .select("id")
            .eq("account_id", ctx.accountId)
            .eq("whatsapp", whatsapp)
            .eq("email", email)
            .maybeSingle();

          if (!existingExtraContact) {
            await db.from("lp_account_contacts").insert({
              account_id: ctx.accountId,
              whatsapp,
              whatsapp_display: whatsappDisplay,
              email,
              is_primary: false,
            });
          }
        }
      }
    }

    // 2. Sincronizar endereço principal
    if (office.address || office.city) {
      const address = (office.address ?? "").trim();
      const [cidade = "", uf = ""] = (office.city ?? "")
        .split("/")
        .map((s) => s.trim());
      const mapsUrl = (office.mapsUrl ?? "").trim();

      const { data: existingAddr } = await db
        .from("lp_account_addresses")
        .select("id")
        .eq("account_id", ctx.accountId)
        .eq("address", address)
        .eq("cidade", cidade)
        .eq("uf", uf)
        .maybeSingle();

      if (!existingAddr) {
        await db.from("lp_account_addresses").insert({
          account_id: ctx.accountId,
          address,
          cidade,
          uf,
          maps_url: mapsUrl || null,
          is_primary: false, // O trigger do banco cuidará de promover para true se for o único/primeiro
        });
      }
    }

    // Sincronizar endereços extras
    if (Array.isArray(office.extraAddresses)) {
      for (const a of office.extraAddresses) {
        if (a.address || a.city) {
          const address = (a.address ?? "").trim();
          const [cidade = "", uf = ""] = (a.city ?? "")
            .split("/")
            .map((s) => s.trim());
          const mapsUrl = (a.mapsUrl ?? "").trim();

          const { data: existingExtraAddr } = await db
            .from("lp_account_addresses")
            .select("id")
            .eq("account_id", ctx.accountId)
            .eq("address", address)
            .eq("cidade", cidade)
            .eq("uf", uf)
            .maybeSingle();

          if (!existingExtraAddr) {
            await db.from("lp_account_addresses").insert({
              account_id: ctx.accountId,
              address,
              cidade,
              uf,
              maps_url: mapsUrl || null,
              is_primary: false,
            });
          }
        }
      }
    }

    // 3. Sincronizar redes sociais
    if (Array.isArray(office.socials)) {
      for (const s of office.socials) {
        if (s.url) {
          const url = s.url.trim();
          const network = s.network;

          const { data: existingSocial } = await db
            .from("lp_account_socials")
            .select("id")
            .eq("account_id", ctx.accountId)
            .eq("network", network)
            .eq("url", url)
            .maybeSingle();

          if (!existingSocial) {
            await db.from("lp_account_socials").insert({
              account_id: ctx.accountId,
              network,
              url,
              is_primary: false, // O trigger do banco cuidará de promover para true se for o único/primeiro daquela rede
            });
          }
        }
      }
    }
  }
}

export async function publishLp(session: Session, slug: string): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) throw new Error("slug inválido");
  const db = createLpUserClient(session);
  const { error } = await db
    .from("landing_pages")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("slug", safe);
  if (error) throwDbError(error);
}

export async function unpublishLp(
  session: Session,
  slug: string,
): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) throw new Error("slug inválido");
  const db = createLpUserClient(session);
  const { error } = await db
    .from("landing_pages")
    .update({ status: "draft", published_at: null })
    .eq("slug", safe);
  if (error) throwDbError(error);
}

/** LP publicada — sem autenticação (cliente anônimo + policy pública). */
export async function getLpPublic(
  officeSubdomain: string,
  lpSlug: string,
): Promise<StoredLp | null> {
  const office = safeSlug(officeSubdomain);
  const slug = safeSlug(lpSlug);
  if (!office || !slug) return null;

  const db = createLpAnonClient();
  const { data, error } = await db
    .from("landing_pages")
    .select("slug,office_subdomain,name,tema,status,schema")
    .eq("office_subdomain", office)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const row = data as LandingPageRow;
  return migrate({
    slug: row.slug,
    officeSubdomain: row.office_subdomain,
    name: row.name,
    tema: row.tema ?? "",
    status: "published",
    schema: row.schema,
  });
}

/** Remove uma LP (RLS: owner/super_admin). */
export async function deleteLp(session: Session, slug: string): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) return;
  const db = createLpUserClient(session);
  const { error } = await db.from("landing_pages").delete().eq("slug", safe);
  if (error) throwDbError(error);
}

/**
 * LP salva com o Topo de vídeo (variante aposentada): move o `videoId` para uma
 * seção de vídeo e a fixa como a primeira do meio — Topo → Vídeo → Dores.
 *
 * `migrate` roda a cada leitura e só persiste quando o usuário salva, então o id
 * da seção precisa ser derivado do slug: um uuid novo a cada leitura criaria uma
 * seção diferente toda vez.
 */
function migrateHeroVideoToSection(
  lp: StoredLp,
  layout: { order?: string[] },
): void {
  const videoId = (lp.schema.videoId ?? "").trim();
  const sections = lp.schema.customSections ?? [];
  // Já tem seção de vídeo (o usuário criou uma na mão): nada a migrar.
  if (!videoId || sections.some((s) => s.kind === "youtube")) return;

  const id = `video-${lp.slug}`;
  lp.schema.customSections = [buildVideoSection(id, videoId), ...sections];
  layout.order = orderWithVideoFirst(layout.order, id);
}

function migrate(lp: StoredLp): StoredLp {
  const office = lp.schema?.office as
    | (StoredLp["schema"]["office"] & { lawyerPhotos?: string[] })
    | undefined;
  if (office && !Array.isArray(office.lawyers)) {
    const photos = Array.isArray(office.lawyerPhotos)
      ? office.lawyerPhotos
      : [];
    office.lawyers = photos.map((photo) => ({ photo, name: "", role: "" }));
    delete office.lawyerPhotos;
  }
  if (office?.sectionImages && office.sectionImages.solucao === undefined) {
    office.sectionImages.solucao = "";
  }
  if (
    office?.sectionImages &&
    office.sectionImages.heroDestaque === undefined
  ) {
    office.sectionImages.heroDestaque = "";
  }
  if (office && !Array.isArray((office as { socials?: unknown }).socials)) {
    office.socials = [];
  }
  if (office && typeof (office as { mapsUrl?: unknown }).mapsUrl !== "string") {
    office.mapsUrl = "";
  }

  const layout = lp.schema?.layout as unknown as
    | {
        hero?: string;
        dor?: string;
        solucao?: string;
        sobre?: string;
        equipe?: string;
        areas?: string;
        etapas?: string;
        tones?: Partial<StoredLp["schema"]["layout"]["tones"]>;
        hidden?: StoredLp["schema"]["layout"]["hidden"];
        order?: string[];
      }
    | undefined;
  if (layout) {
    // O Topo com vídeo foi aposentado: o vídeo passou a viver numa seção só
    // dele, logo abaixo do Topo. LPs antigas caem numa variante sem vídeo e
    // ganham essa seção (ver `migrateHeroVideoToSection` abaixo).
    const heroWasVideo = isLegacyHeroVideoVariant(layout.hero);
    layout.hero =
      normalizeHeroVariant(layout.hero) ??
      (heroWasVideo ? HERO_VARIANT_VIDEO_FALLBACK : DEFAULT_LAYOUT.hero);
    if (heroWasVideo) migrateHeroVideoToSection(lp, layout);
    let dorToneFromOld: "light" | "dark" | undefined;
    if (layout.dor === "clara") {
      layout.dor = "comImagem";
      dorToneFromOld = "light";
    } else if (layout.dor === "escura") {
      layout.dor = "soCards";
      dorToneFromOld = "dark";
    }
    layout.dor = normalizeDorVariant(layout.dor) ?? DEFAULT_LAYOUT.dor;
    if (layout.solucao === "cards") layout.solucao = "soCards";
    layout.solucao =
      normalizeSolucaoVariant(layout.solucao) ?? DEFAULT_LAYOUT.solucao;
    layout.sobre = normalizeSobreVariant(layout.sobre) ?? DEFAULT_LAYOUT.sobre;
    layout.equipe = normalizeEquipeVariant(layout.equipe);
    layout.areas = normalizeAreasVariant(layout.areas) ?? DEFAULT_LAYOUT.areas;
    layout.etapas =
      normalizeEtapasVariant(layout.etapas) ?? DEFAULT_LAYOUT.etapas;
    const sobreToneFromOld: "light" | "dark" =
      layout.sobre === SOBRE_VARIANT_OVERLAY_PORTRAIT ? "dark" : "light";
    if (!layout.tones) {
      layout.tones = {
        ...DEFAULT_LAYOUT.tones,
        dor: dorToneFromOld ?? DEFAULT_LAYOUT.tones.dor,
        sobre: sobreToneFromOld,
      };
    } else {
      if (!layout.tones.dor)
        layout.tones.dor = dorToneFromOld ?? DEFAULT_LAYOUT.tones.dor;
      if (!layout.tones.sobre) layout.tones.sobre = sobreToneFromOld;
      if (!layout.tones.etapas)
        layout.tones.etapas = DEFAULT_LAYOUT.tones.etapas;
    }
    if (!layout.tones.hero) layout.tones.hero = DEFAULT_LAYOUT.tones.hero;
    if (!layout.hidden) layout.hidden = { ...DEFAULT_LAYOUT.hidden };
  }

  const schema = lp.schema as unknown as { etapas?: unknown } | undefined;
  if (schema && !schema.etapas) schema.etapas = GENERIC_ETAPAS;

  if (lp.schema) {
    lp.schema.seo = normalizeSeo(lp.schema.seo, lp.schema, lp.tema, {
      officeSubdomain: lp.officeSubdomain,
      lpSlug: lp.slug,
    });
  }

  return lp;
}

/** Remove contatos, endereços e redes sociais órfãos e imagens órfãs para a conta. */
export async function deleteOrphanedAssets(session: Session): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  // 1. Apagar imagens órfãs usando a função existente
  await deleteOrphanedImages(session);

  // 2. Buscar todas as landing pages restantes da conta
  const { data: lps, error: lpsError } = await db
    .from("landing_pages")
    .select("schema")
    .eq("account_id", ctx.accountId);

  if (lpsError) throwDbError(lpsError);

  // Mapear todos os valores usados nas LPs
  const usedWhatsapps = new Set<string>();
  const usedEmails = new Set<string>();
  const usedAddresses = new Set<string>();
  const usedSocialUrls = new Set<string>();

  for (const lp of lps || []) {
    const office = lp.schema?.office;
    if (!office) continue;

    // Contatos principais
    if (office.whatsapp) usedWhatsapps.add(office.whatsapp.replace(/\D/g, ""));
    if (office.email) usedEmails.add(office.email.trim().toLowerCase());

    // Contatos adicionais
    if (office.extraContacts) {
      for (const c of office.extraContacts) {
        if (c.whatsapp) usedWhatsapps.add(c.whatsapp.replace(/\D/g, ""));
        if (c.email) usedEmails.add(c.email.trim().toLowerCase());
      }
    }

    // Endereço principal
    if (office.address) usedAddresses.add(office.address.trim());

    // Endereços adicionais
    if (office.extraAddresses) {
      for (const a of office.extraAddresses) {
        if (a.address) usedAddresses.add(a.address.trim());
      }
    }

    // Redes sociais
    if (office.socials) {
      for (const s of office.socials) {
        if (s.url) usedSocialUrls.add(s.url.trim().toLowerCase());
      }
    }
  }

  // 3. Excluir contatos órfãos (is_primary = false E não usados em nenhuma LP)
  const { data: contacts, error: contactsError } = await db
    .from("lp_account_contacts")
    .select("id, whatsapp, email")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", false);

  if (!contactsError && contacts) {
    const toDeleteContacts = contacts.filter((c) => {
      const whatsappClean = c.whatsapp?.replace(/\D/g, "") ?? "";
      const emailClean = c.email?.trim().toLowerCase() ?? "";
      return !usedWhatsapps.has(whatsappClean) && !usedEmails.has(emailClean);
    });

    if (toDeleteContacts.length > 0) {
      await db
        .from("lp_account_contacts")
        .delete()
        .in(
          "id",
          toDeleteContacts.map((c) => c.id),
        );
    }
  }

  // 4. Excluir endereços órfãos (is_primary = false E não usados em nenhuma LP)
  const { data: addresses, error: addressesError } = await db
    .from("lp_account_addresses")
    .select("id, address")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", false);

  if (!addressesError && addresses) {
    const toDeleteAddresses = addresses.filter((a) => {
      const addrClean = a.address?.trim() ?? "";
      return !usedAddresses.has(addrClean);
    });

    if (toDeleteAddresses.length > 0) {
      await db
        .from("lp_account_addresses")
        .delete()
        .in(
          "id",
          toDeleteAddresses.map((a) => a.id),
        );
    }
  }

  // 5. Excluir redes sociais órfãs (is_primary = false E não usadas em nenhuma LP)
  const { data: socials, error: socialsError } = await db
    .from("lp_account_socials")
    .select("id, url")
    .eq("account_id", ctx.accountId)
    .eq("is_primary", false);

  if (!socialsError && socials) {
    const toDeleteSocials = socials.filter((s) => {
      const urlClean = s.url?.trim().toLowerCase() ?? "";
      return !usedSocialUrls.has(urlClean);
    });

    if (toDeleteSocials.length > 0) {
      await db
        .from("lp_account_socials")
        .delete()
        .in(
          "id",
          toDeleteSocials.map((s) => s.id),
        );
    }
  }
}

export type { LpContext };
