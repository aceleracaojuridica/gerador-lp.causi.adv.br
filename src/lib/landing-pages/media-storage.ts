import "server-only";

import type { Session } from "@/lib/session/types";
import { uploadGalleryImage } from "./gallery-store";
import type { MediaResource } from "./media-types";
import type { LpSchema, SectionImageKey } from "./schema";

export const GERADOR_LP_BUCKET = "gerador-lp-assets";

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

const safeSegment = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();

/** Raiz do site no bucket (legado): `{subdomain}.causi.adv.br` ou fallback por usuário. */
export function storageSiteRoot(
  subdomain: string | null,
  userId: string,
): string {
  if (subdomain?.trim()) {
    return `${safeSegment(subdomain)}.causi.adv.br`;
  }
  return `_sem-subdominio/${safeSegment(userId)}`;
}

/** Monta path legado de um arquivo no bucket. */
export function buildMediaPath(
  subdomain: string | null,
  userId: string,
  lpSlug: string,
  resource: MediaResource,
): string {
  const root = `${storageSiteRoot(subdomain, userId)}/${safeSlug(lpSlug)}`;
  switch (resource.kind) {
    case "logo":
      return `${root}/logo/logo.webp`;
    case "lawyers":
      return `${root}/lawyers/${safeSegment(resource.id)}.webp`;
    case "sections":
      return `${root}/sections/${resource.key}.webp`;
    case "seo":
      return `${root}/seo/${resource.key}.webp`;
  }
}

export function isDataUrl(src: string): boolean {
  return /^data:image\//i.test(src.trim());
}

/** URL já apontando para o bucket deste projeto. */
export function isGeradorStorageUrl(src: string): boolean {
  const base = process.env.LP_SUPABASE_URL?.replace(/\/$/, "");
  if (!base || !src.trim()) return false;
  return src.startsWith(
    `${base}/storage/v1/object/public/${GERADOR_LP_BUCKET}/`,
  );
}

export function getPublicMediaUrl(path: string): string {
  const base = process.env.LP_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) return path;
  return `${base}/storage/v1/object/public/${GERADOR_LP_BUCKET}/${path}`;
}

/**
 * Envia data URL ou URL externa para a galeria da conta.
 * URLs já no bucket são mantidas.
 */
export async function persistMediaToGallery(
  session: Session,
  source: string,
  originalFilename?: string,
): Promise<string> {
  const trimmed = source.trim();
  if (!trimmed) return "";
  if (isGeradorStorageUrl(trimmed)) return trimmed;

  const item = await uploadGalleryImage(session, trimmed, originalFilename);
  return item.url;
}

/**
 * Percorre o schema e envia mídias inline/externas para a galeria.
 * URLs já no Storage (legado ou galeria) são preservadas.
 */
export async function persistLpSchemaMedia(
  schema: LpSchema,
  ctx: {
    session: Session;
    subdomain: string | null;
    userId: string;
    accountId: number;
    slug: string;
  },
): Promise<LpSchema> {
  const office = { ...schema.office };
  const sectionImages = { ...office.sectionImages };

  if (office.logoSrc) {
    office.logoSrc = await persistMediaToGallery(ctx.session, office.logoSrc);
  }

  office.lawyers = await Promise.all(
    office.lawyers.map(async (lawyer) => {
      if (!lawyer.photo) return lawyer;
      return {
        ...lawyer,
        photo: await persistMediaToGallery(ctx.session, lawyer.photo),
      };
    }),
  );

  for (const key of Object.keys(sectionImages) as SectionImageKey[]) {
    const src = sectionImages[key];
    if (!src) continue;
    sectionImages[key] = await persistMediaToGallery(ctx.session, src);
  }
  office.sectionImages = sectionImages;

  const seo = schema.seo ? { ...schema.seo } : undefined;
  if (seo) {
    if (seo.ogImage) {
      seo.ogImage = await persistMediaToGallery(ctx.session, seo.ogImage);
    }
    if (seo.favicon) {
      seo.favicon = await persistMediaToGallery(ctx.session, seo.favicon);
    }
  }

  return { ...schema, office, ...(seo ? { seo } : {}) };
}

/** Upload para galeria (substitui path legado por galeria centralizada). */
export async function uploadMediaToPath(
  session: Session,
  source: string,
  _path: string,
): Promise<string> {
  const trimmed = source.trim();
  if (!trimmed) return "";
  if (isGeradorStorageUrl(trimmed)) return trimmed;

  if (isDataUrl(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return persistMediaToGallery(session, trimmed);
  }
  return trimmed;
}
