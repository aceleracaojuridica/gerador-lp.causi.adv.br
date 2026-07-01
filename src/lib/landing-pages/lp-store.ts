import { lpAdmin } from "@/lib/supabase/admin";
import { GENERIC_ETAPAS } from "./focos";
import { buildLpListPreview, type LpListPreview } from "./lp-preview";
import {
  GERADOR_LP_BUCKET,
  persistLpSchemaMedia,
  storageSiteRoot,
} from "./media-storage";
import type { LpSchema, StoredLp } from "./schema";
import { DEFAULT_LAYOUT } from "./schema";
import { normalizeSeo } from "./seo";

const db = () => lpAdmin();

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

/** Verifica se um slug já está em uso (qualquer usuário). */
export async function isLpSlugTaken(slug: string): Promise<boolean> {
  const safe = safeSlug(slug);
  if (!safe) return true;
  const { data } = await db()
    .from("landing_pages")
    .select("id")
    .eq("slug", safe)
    .maybeSingle();
  return !!data;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type LandingPageRow = {
  slug: string;
  name: string;
  tema: string;
  status: "draft" | "published";
  schema: StoredLp["schema"];
};

/** Vínculo opcional com `profiles` (Lovable) quando o usuário tem subdomínio. */
async function resolveProfileId(causiUserId: string): Promise<string | null> {
  if (!UUID_RE.test(causiUserId)) return null;
  const { data } = await db()
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
};

/** Lista resumida das LPs do usuário (para a galeria). */
export async function listLps(userId: string): Promise<LpListItem[]> {
  const { data, error } = await db()
    .from("landing_pages")
    .select("slug,name,tema,status,schema,updated_at")
    .eq("causi_user_id", userId)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return (
    data as Pick<
      LandingPageRow,
      "slug" | "name" | "tema" | "status" | "schema"
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
    };
  });
}

/** Carrega uma LP completa do usuário pelo slug. */
export async function getLp(
  userId: string,
  slug: string,
): Promise<StoredLp | null> {
  const safe = safeSlug(slug);
  const { data, error } = await db()
    .from("landing_pages")
    .select("slug,name,tema,status,schema")
    .eq("causi_user_id", userId)
    .eq("slug", safe)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as LandingPageRow;
  return migrate({
    slug: row.slug,
    name: row.name,
    tema: row.tema ?? "",
    status: row.status ?? "draft",
    schema: row.schema,
  });
}

/** Salva (cria ou sobrescreve) uma LP do usuário. */
export async function saveLp(userId: string, lp: StoredLp): Promise<void> {
  const safe = safeSlug(lp.slug);
  if (!safe) throw new Error("slug inválido");

  // Slug é global: garante que não está ocupado por outro usuário
  const { data: conflict } = await db()
    .from("landing_pages")
    .select("id")
    .eq("slug", safe)
    .neq("causi_user_id", userId)
    .maybeSingle();
  if (conflict) throw new Error(`slug-conflict:${safe}`);

  const subdomain = await getUserSubdomain(userId);
  const schema = await persistLpSchemaMedia(lp.schema, {
    subdomain,
    userId,
    slug: safe,
  });

  const profileId = await resolveProfileId(userId);
  const row = {
    causi_user_id: userId,
    profile_id: profileId,
    slug: safe,
    name: lp.name ?? "",
    tema: lp.tema ?? "",
    status: lp.status ?? "draft",
    schema,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db()
    .from("landing_pages")
    .upsert(row, { onConflict: "slug" });
  if (error) throw new Error(error.message);
}

/**
 * Publica uma LP: muda status para 'published' e registra published_at.
 * Só altera a LP se pertencer ao usuário.
 */
export async function publishLp(userId: string, slug: string): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) throw new Error("slug inválido");
  const { error } = await db()
    .from("landing_pages")
    .update({ status: "published", published_at: new Date().toISOString() })
    .eq("causi_user_id", userId)
    .eq("slug", safe);
  if (error) throw new Error(error.message);
}

/**
 * Despublica uma LP: volta para draft. Só altera se pertencer ao usuário.
 */
export async function unpublishLp(userId: string, slug: string): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) throw new Error("slug inválido");
  const { error } = await db()
    .from("landing_pages")
    .update({ status: "draft", published_at: null })
    .eq("causi_user_id", userId)
    .eq("slug", safe);
  if (error) throw new Error(error.message);
}

/**
 * Carrega uma LP pelo slug sem exigir autenticação — usada pela rota pública
 * `app/[slug]` (acesso via subdomínio). Só retorna LPs com status 'published'.
 */
export async function getLpPublic(slug: string): Promise<StoredLp | null> {
  const safe = safeSlug(slug);
  if (!safe) return null;

  const { data, error } = await db()
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

/** Remove uma LP do usuário pelo slug e limpa os assets no Storage. */
export async function deleteLp(userId: string, slug: string): Promise<void> {
  const safe = safeSlug(slug);
  if (!safe) return;

  // Remove a linha do banco
  await db()
    .from("landing_pages")
    .delete()
    .eq("causi_user_id", userId)
    .eq("slug", safe);

  // Limpa os assets do Storage (melhor esforço — não lança erro se falhar)
  try {
    const subdomain = await getUserSubdomain(userId);
    const prefix = storageSiteRoot(subdomain, userId);
    const storage = lpAdmin().storage.from(GERADOR_LP_BUCKET);

    // Lista todos os arquivos sob o prefixo da LP (logo, lawyers, sections)
    const { data: files } = await storage.list(`${prefix}/${safe}`, {
      limit: 200,
    });
    if (files && files.length > 0) {
      const paths = files.map((f) => `${prefix}/${safe}/${f.name}`);
      await storage.remove(paths);
    }

    // Remove também subpastas (sections/, lawyers/, logo/)
    for (const folder of ["sections", "lawyers", "logo"]) {
      const { data: sub } = await storage.list(`${prefix}/${safe}/${folder}`, {
        limit: 200,
      });
      if (sub && sub.length > 0) {
        const paths = sub.map((f) => `${prefix}/${safe}/${folder}/${f.name}`);
        await storage.remove(paths);
      }
    }
  } catch {
    // Storage cleanup é melhor esforço
  }
}

/** Subdomínio Lovable do usuário (quando existir profile vinculado). */
export async function getUserSubdomain(userId: string): Promise<string | null> {
  if (!UUID_RE.test(userId)) return null;
  const { data } = await db()
    .from("profiles")
    .select("subdomain")
    .eq("id", userId)
    .maybeSingle();
  return (data?.subdomain as string | undefined) ?? null;
}

/* Compatibiliza LPs antigas com o schema atual. */
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
