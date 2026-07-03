import "server-only";

import type { LpDbClient } from "@/lib/supabase/lp-client";
import {
  createLpAnonClient,
  createLpServiceClient,
  createLpUserClient,
  type LpContext,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import type { Session } from "@/lib/session/types";
import { GENERIC_ETAPAS } from "./focos";
import { syncImageUsagesFromSchema } from "./image-usages";
import { buildLpListPreview, type LpListPreview } from "./lp-preview";
import { persistLpSchemaMedia } from "./media-storage";
import type { LpSchema, StoredLp } from "./schema";
import { DEFAULT_LAYOUT } from "./schema";
import { normalizeSeo } from "./seo";
import { allocateUniqueLpSlug, slugFromOfficeName } from "./slug";

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OFFICE_SUBDOMAIN_BACKFILL_PREFIX = "acct-";

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

function isBackfillOfficeSubdomain(value: string): boolean {
  return value.startsWith(OFFICE_SUBDOMAIN_BACKFILL_PREFIX);
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

async function isOfficeSubdomainTakenByOtherAccount(
  subdomain: string,
  accountId: number,
): Promise<boolean> {
  const db = createLpServiceClient();
  const { data } = await db
    .from("landing_pages")
    .select("account_id")
    .eq("office_subdomain", subdomain)
    .neq("account_id", accountId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

/**
 * Subdomínio fixo do escritório (derivado do nome da conta).
 * Persistido em todas as LPs da conta; único globalmente entre contas.
 */
export async function resolveOfficeSubdomain(
  session: Session,
): Promise<string> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data: existing } = await db
    .from("landing_pages")
    .select("office_subdomain")
    .eq("account_id", ctx.accountId)
    .limit(1)
    .maybeSingle();

  const current = existing?.office_subdomain as string | undefined;
  if (current && !isBackfillOfficeSubdomain(current)) {
    return current;
  }

  const base = slugFromOfficeName(session.account.name);
  if (!base) {
    throw new Error("Nome da conta inválido para subdomínio do escritório.");
  }

  const subdomain = await allocateUniqueLpSlug(base, (candidate) =>
    isOfficeSubdomainTakenByOtherAccount(candidate, ctx.accountId),
  );
  if (!subdomain) {
    throw new Error("subdomain-conflict");
  }

  if (current && isBackfillOfficeSubdomain(current)) {
    const { error } = await db
      .from("landing_pages")
      .update({ office_subdomain: subdomain })
      .eq("account_id", ctx.accountId);
    if (error) throwDbError(error);
  }

  return subdomain;
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
  createdByUserId: string;
};

/** Lista resumida das LPs da conta (para a galeria). */
export async function listLps(session: Session): Promise<LpListItem[]> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("landing_pages")
    .select(
      "slug,office_subdomain,name,tema,status,schema,updated_at,created_by_user_id",
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
  if (office && !Array.isArray((office as { socials?: unknown }).socials)) {
    office.socials = [];
  }
  if (office && typeof (office as { mapsUrl?: unknown }).mapsUrl !== "string") {
    office.mapsUrl = "";
  }

  const layout = lp.schema?.layout as unknown as
    | {
        dor?: string;
        solucao?: string;
        sobre?: string;
        etapas?: string;
        tones?: Partial<StoredLp["schema"]["layout"]["tones"]>;
        hidden?: StoredLp["schema"]["layout"]["hidden"];
      }
    | undefined;
  if (layout) {
    let dorToneFromOld: "light" | "dark" | undefined;
    if (layout.dor === "clara") {
      layout.dor = "comImagem";
      dorToneFromOld = "light";
    } else if (layout.dor === "escura") {
      layout.dor = "soCards";
      dorToneFromOld = "dark";
    }
    if (layout.solucao === "cards") layout.solucao = "soCards";
    const sobreToneFromOld: "light" | "dark" =
      layout.sobre === "overlay" ? "dark" : "light";
    if (!layout.etapas) layout.etapas = DEFAULT_LAYOUT.etapas;
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

export type { LpContext };
