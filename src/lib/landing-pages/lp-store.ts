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

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LandingPageRow = {
  id: string;
  slug: string;
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

/** Verifica se um slug já está em uso (qualquer usuário). */
export async function isLpSlugTaken(
  session: Session,
  slug: string,
): Promise<boolean> {
  const safe = safeSlug(slug);
  if (!safe) return true;
  const db = createLpUserClient(session);
  const { data } = await db
    .from("landing_pages")
    .select("id")
    .eq("slug", safe)
    .maybeSingle();
  return !!data;
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
    .select("slug,name,tema,status,schema,updated_at,created_by_user_id")
    .eq("account_id", ctx.accountId)
    .order("updated_at", { ascending: false });
  if (error) throwDbError(error);
  if (!data) return [];

  return (
    data as Pick<
      LandingPageRow,
      "slug" | "name" | "tema" | "status" | "schema" | "created_by_user_id"
    >[]
  ).map((r) => {
    const slug = r.slug;
    const name = r.name || slug;
    const tema = r.tema || "";
    const schema = r.schema as LpSchema | null;

    return {
      slug,
      name,
      tema,
      status: r.status ?? "draft",
      preview: buildLpListPreview({ schema, slug, tema, name }),
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
    .select("slug,name,tema,status,schema")
    .eq("slug", safe)
    .maybeSingle();
  if (error) throwDbError(error);
  if (!data) return null;
  const row = data as LandingPageRow;
  return migrate({
    slug: row.slug,
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
    .maybeSingle();

  if (conflict && Number(conflict.account_id) !== ctx.accountId) {
    throw new Error(`slug-conflict:${safe}`);
  }

  const subdomain = await getUserSubdomain(session);
  const schema = await persistLpSchemaMedia(lp.schema, {
    session,
    subdomain,
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
    slug: safe,
    name: lp.name ?? "",
    tema: lp.tema ?? "",
    status: lp.status ?? "draft",
    schema,
    updated_at: new Date().toISOString(),
  };

  const { data: saved, error } = await db
    .from("landing_pages")
    .upsert(row, { onConflict: "slug" })
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
export async function getLpPublic(slug: string): Promise<StoredLp | null> {
  const safe = safeSlug(slug);
  if (!safe) return null;

  const db = createLpAnonClient();
  const { data, error } = await db
    .from("landing_pages")
    .select("slug,name,tema,status,schema")
    .eq("slug", safe)
    .eq("status", "published")
    .maybeSingle();
  if (error || !data) return null;
  const row = data as LandingPageRow;
  return migrate({
    slug: row.slug,
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

export async function getUserSubdomain(
  session: Session,
): Promise<string | null> {
  const userId = session.user.id;
  if (!UUID_RE.test(userId)) return null;
  const db = createLpServiceClient();
  const { data } = await db
    .from("profiles")
    .select("subdomain")
    .eq("id", userId)
    .maybeSingle();
  return (data?.subdomain as string | undefined) ?? null;
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
    lp.schema.seo = normalizeSeo(lp.schema.seo, lp.schema, lp.tema);
  }

  return lp;
}

export type { LpContext };
