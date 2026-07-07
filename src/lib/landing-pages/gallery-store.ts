import "server-only";

import sharp from "sharp";
import type { Session } from "@/lib/session/types";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import {
  GERADOR_LP_BUCKET,
  getPublicMediaUrl,
  isGeradorStorageUrl,
} from "./media-storage";

export type GalleryImageUsage = {
  landingPageId: string;
  slug: string;
  name: string;
  officeSubdomain: string;
  slot: string;
};

export type GalleryImageItem = {
  id: string;
  storagePath: string;
  url: string;
  originalFilename: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
  uploadedByUserId: string;
  usages: GalleryImageUsage[];
};

function galleryPath(accountId: number, imageId: string): string {
  return `${accountId}/gallery/${imageId}.webp`;
}

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

type UsageRow = {
  landing_page_id: string;
  slot: string;
  landing_pages: {
    slug: string;
    name: string;
    office_subdomain: string;
  } | null;
};

/** Lista imagens da galeria da conta com usos. */
export async function listGalleryImages(
  session: Session,
): Promise<GalleryImageItem[]> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data, error } = await db
    .from("lp_account_images")
    .select(
      `
      id,
      storage_path,
      original_filename,
      size_bytes,
      width,
      height,
      created_at,
      uploaded_by_user_id,
      lp_image_usages (
        landing_page_id,
        slot,
        landing_pages ( slug, name, office_subdomain )
      )
    `,
    )
    .eq("account_id", ctx.accountId)
    .order("created_at", { ascending: false });

  if (error) throwDbError(error);
  if (!data) return [];

  return data.map((row) => {
    const usagesRaw = (row.lp_image_usages ?? []) as unknown as UsageRow[];
    const usages: GalleryImageUsage[] = usagesRaw.map((u) => ({
      landingPageId: u.landing_page_id,
      slug: u.landing_pages?.slug ?? "",
      name: u.landing_pages?.name ?? "",
      officeSubdomain: u.landing_pages?.office_subdomain ?? "",
      slot: u.slot,
    }));

    return {
      id: row.id as string,
      storagePath: row.storage_path as string,
      url: getPublicMediaUrl(row.storage_path as string),
      originalFilename: (row.original_filename as string | null) ?? null,
      sizeBytes: Number(row.size_bytes ?? 0),
      width: (row.width as number | null) ?? null,
      height: (row.height as number | null) ?? null,
      createdAt: row.created_at as string,
      uploadedByUserId: row.uploaded_by_user_id as string,
      usages,
    };
  });
}

async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  const pipeline = sharp(buffer).rotate().resize({
    width: 2400,
    height: 2400,
    fit: "inside",
    withoutEnlargement: true,
  });
  const output = await pipeline.webp({ quality: 85 }).toBuffer();
  const meta = await sharp(output).metadata();
  return {
    buffer: output,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

function decodeDataUrl(dataUrl: string): Buffer {
  const match = dataUrl.trim().match(/^data:image\/[^;]+;base64,([\s\S]+)$/);
  if (!match) throw new Error("Data URL de imagem inválida.");
  return Buffer.from(match[1], "base64");
}

async function sourceToBuffer(source: string): Promise<Buffer> {
  const trimmed = source.trim();
  if (/^data:image\//i.test(trimmed)) return decodeDataUrl(trimmed);
  if (/^https?:\/\//i.test(trimmed)) {
    const res = await fetch(trimmed, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status}).`);
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error("Formato de imagem não suportado.");
}

/** Envia imagem para a galeria da conta. */
export async function uploadGalleryImage(
  session: Session,
  source: string,
  originalFilename?: string,
): Promise<GalleryImageItem> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const imageId = crypto.randomUUID();
  const path = galleryPath(ctx.accountId, imageId);

  const input = await sourceToBuffer(source);
  const { buffer, width, height } = await optimizeImage(input);

  const { error: uploadError } = await db.storage
    .from(GERADOR_LP_BUCKET)
    .upload(path, buffer, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });
  if (uploadError) throwDbError(uploadError);

  const { data, error } = await db
    .from("lp_account_images")
    .insert({
      id: imageId,
      account_id: ctx.accountId,
      uploaded_by_user_id: ctx.userId,
      storage_path: path,
      original_filename: originalFilename ?? null,
      mime_type: "image/webp",
      size_bytes: buffer.byteLength,
      width,
      height,
    })
    .select(
      "id,storage_path,original_filename,size_bytes,width,height,created_at,uploaded_by_user_id",
    )
    .single();

  if (error) throwDbError(error);

  return {
    id: data.id as string,
    storagePath: data.storage_path as string,
    url: getPublicMediaUrl(data.storage_path as string),
    originalFilename: (data.original_filename as string | null) ?? null,
    sizeBytes: Number(data.size_bytes ?? 0),
    width: (data.width as number | null) ?? null,
    height: (data.height as number | null) ?? null,
    createdAt: data.created_at as string,
    uploadedByUserId: data.uploaded_by_user_id as string,
    usages: [],
  };
}

/** Remove imagem da galeria (RLS + trigger de uso). */
export async function deleteGalleryImage(
  session: Session,
  imageId: string,
): Promise<void> {
  const db = createLpUserClient(session);

  const { data: image, error: fetchError } = await db
    .from("lp_account_images")
    .select("storage_path")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchError) throwDbError(fetchError);
  if (!image) throw new Error("Imagem não encontrada.");

  const { error: deleteRowError } = await db
    .from("lp_account_images")
    .delete()
    .eq("id", imageId);
  if (deleteRowError) throwDbError(deleteRowError);

  await db.storage
    .from(GERADOR_LP_BUCKET)
    .remove([image.storage_path as string]);
}

/** Remove todas as imagens órfãs (sem usos) da galeria da conta. */
export async function deleteOrphanedImages(session: Session): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  // Seleciona imagens sem usos
  const { data: orphaned, error: fetchError } = await db
    .from("lp_account_images")
    .select(`
      id,
      storage_path,
      lp_image_usages!left (
        id
      )
    `)
    .eq("account_id", ctx.accountId)
    .is("lp_image_usages.id", null);

  if (fetchError) throwDbError(fetchError);
  if (!orphaned || orphaned.length === 0) return;

  const ids = orphaned.map((img) => img.id as string);
  const paths = orphaned.map((img) => img.storage_path as string);

  // Deleta do banco
  const { error: deleteRowError } = await db
    .from("lp_account_images")
    .delete()
    .in("id", ids);
  if (deleteRowError) throwDbError(deleteRowError);

  // Remove do storage
  await db.storage.from(GERADOR_LP_BUCKET).remove(paths);
}

export function isGalleryStorageUrl(url: string): boolean {
  return isGeradorStorageUrl(url) && url.includes("/gallery/");
}
