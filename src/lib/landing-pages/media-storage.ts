import "server-only";

import sharp from "sharp";
import { lpAdmin } from "@/lib/supabase/admin";
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

/** Raiz do site no bucket: `{subdomain}.causi.adv.br` ou fallback por usuário. */
export function storageSiteRoot(
  subdomain: string | null,
  userId: string,
): string {
  if (subdomain?.trim()) {
    return `${safeSegment(subdomain)}.causi.adv.br`;
  }
  return `_sem-subdominio/${safeSegment(userId)}`;
}

/** Monta o path completo de um arquivo no bucket. */
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
  const { data } = lpAdmin().storage.from(GERADOR_LP_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.trim().match(/^data:image\/[^;]+;base64,([\s\S]+)$/);
  if (!match) throw new Error("Data URL de imagem inválida.");
  return Buffer.from(match[1], "base64");
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status}).`);
  return Buffer.from(await res.arrayBuffer());
}

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 85 })
    .toBuffer();
}

async function uploadBuffer(path: string, buffer: Buffer): Promise<void> {
  const { error } = await lpAdmin()
    .storage.from(GERADOR_LP_BUCKET)
    .upload(path, buffer, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
  if (error) throw new Error(error.message);
}

/**
 * Faz upload de uma imagem (data URL ou URL externa) para o path indicado.
 * Retorna a URL pública no Storage.
 */
export async function uploadMediaToPath(
  source: string,
  path: string,
): Promise<string> {
  const trimmed = source.trim();
  if (!trimmed) return "";

  if (isGeradorStorageUrl(trimmed)) return trimmed;

  let buffer: Buffer;
  if (isDataUrl(trimmed)) {
    buffer = decodeDataUrl(trimmed);
  } else if (/^https?:\/\//i.test(trimmed)) {
    buffer = await fetchImageBuffer(trimmed);
  } else {
    return trimmed;
  }

  const optimized = await optimizeImage(buffer);
  await uploadBuffer(path, optimized);
  return getPublicMediaUrl(path);
}

/** Persiste uma mídia conforme o recurso (logo, advogado, seção). */
export async function persistMediaResource(
  source: string,
  ctx: {
    subdomain: string | null;
    userId: string;
    slug: string;
    resource: MediaResource;
  },
): Promise<string> {
  if (!source.trim()) return "";
  if (isGeradorStorageUrl(source)) return source;

  const path = buildMediaPath(
    ctx.subdomain,
    ctx.userId,
    ctx.slug,
    ctx.resource,
  );
  return uploadMediaToPath(source, path);
}

/** Percorre o schema e envia todas as mídias inline/externas para o Storage. */
export async function persistLpSchemaMedia(
  schema: LpSchema,
  ctx: { subdomain: string | null; userId: string; slug: string },
): Promise<LpSchema> {
  const office = { ...schema.office };
  const sectionImages = { ...office.sectionImages };

  if (office.logoSrc) {
    office.logoSrc = await persistMediaResource(office.logoSrc, {
      ...ctx,
      resource: { kind: "logo" },
    });
  }

  office.lawyers = await Promise.all(
    office.lawyers.map(async (lawyer) => {
      if (!lawyer.photo) return lawyer;
      const id =
        lawyer.photo.match(/\/lawyers\/([^./]+)\.webp/i)?.[1] ??
        crypto.randomUUID();
      return {
        ...lawyer,
        photo: await persistMediaResource(lawyer.photo, {
          ...ctx,
          resource: { kind: "lawyers", id },
        }),
      };
    }),
  );

  for (const key of Object.keys(sectionImages) as SectionImageKey[]) {
    const src = sectionImages[key];
    if (!src) continue;
    sectionImages[key] = await persistMediaResource(src, {
      ...ctx,
      resource: { kind: "sections", key },
    });
  }
  office.sectionImages = sectionImages;

  const seo = schema.seo ? { ...schema.seo } : undefined;
  if (seo) {
    if (seo.ogImage) {
      seo.ogImage = await persistMediaResource(seo.ogImage, {
        ...ctx,
        resource: { kind: "seo", key: "ogImage" },
      });
    }
    if (seo.favicon) {
      seo.favicon = await persistMediaResource(seo.favicon, {
        ...ctx,
        resource: { kind: "seo", key: "favicon" },
      });
    }
  }

  return { ...schema, office, ...(seo ? { seo } : {}) };
}
