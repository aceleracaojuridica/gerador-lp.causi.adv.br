"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/lps";
import { ACCESS_DENIED_ERROR, mapLpDbError } from "@/lib/errors";
import { deleteOrphanedImages } from "@/lib/landing-pages/gallery-cleanup";
import {
  deleteGalleryImage,
  type GalleryImageItem,
  listGalleryImages,
  listSystemImagesForGallery,
  uploadGalleryImage,
} from "@/lib/landing-pages/gallery-store";
import {
  type LeadLandingPageOption,
  listAccountLandingPages,
} from "@/lib/landing-pages/lead-store";
import { hasLpAccess, requireAuth, requireLpSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "FORBIDDEN") return ACCESS_DENIED_ERROR;
    const mapped = mapLpDbError(err);
    return mapped.description || err.message;
  }
  return fallback;
}

export type GalleryImageDto = GalleryImageItem & {
  uploadedByName: string;
};

export type GalleryLandingPageDto = LeadLandingPageOption;

async function enrichWithUploaderNames(
  items: GalleryImageItem[],
): Promise<GalleryImageDto[]> {
  const userIds = [...new Set(items.map((i) => i.uploadedByUserId))];
  const accountUserIds = userIds.filter((id) => id !== "system");
  const nameById = new Map<string, string>();

  if (accountUserIds.length > 0) {
    const causi = await createClient();
    const { data } = await causi
      .from("users")
      .select("id,name")
      .in("id", accountUserIds);
    for (const row of data ?? []) {
      nameById.set(row.id as string, (row.name as string) || "Usuário");
    }
  }

  return items.map((item) => ({
    ...item,
    uploadedByName:
      item.source === "system"
        ? "Sistema Causi"
        : (nameById.get(item.uploadedByUserId) ?? "Usuário"),
  }));
}

export async function listGalleryImagesAction(): Promise<
  | {
      ok: true;
      images: GalleryImageDto[];
      landingPages: GalleryLandingPageDto[];
    }
  | { ok: false; error: string }
> {
  try {
    const session = await requireAuth();
    if (!hasLpAccess(session)) {
      return { ok: true, images: [], landingPages: [] };
    }
    const [accountImages, systemImages, landingPages] = await Promise.all([
      listGalleryImages(session),
      listSystemImagesForGallery(session),
      listAccountLandingPages(session),
    ]);
    const images = [...systemImages, ...accountImages];
    const enriched = await enrichWithUploaderNames(images);
    return { ok: true, images: enriched, landingPages };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao listar imagens.") };
  }
}

export async function uploadGalleryImageAction(
  source: string,
  originalFilename?: string,
): Promise<
  { ok: true; image: GalleryImageDto } | { ok: false; error: string }
> {
  try {
    const session = await requireLpSession();
    const image = await uploadGalleryImage(session, source, originalFilename);
    const [enriched] = await enrichWithUploaderNames([image]);
    revalidatePath("/galeria");
    return { ok: true, image: enriched };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao enviar imagem.") };
  }
}

export async function deleteGalleryImageAction(
  imageId: string,
): Promise<ActionResult> {
  try {
    const session = await requireLpSession();
    await deleteGalleryImage(session, imageId);
    revalidatePath("/galeria");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao excluir imagem.") };
  }
}

export async function deleteOrphanedImagesAction(): Promise<ActionResult> {
  try {
    const session = await requireLpSession();
    await deleteOrphanedImages(session);
    revalidatePath("/galeria");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: toMessage(err, "Erro ao excluir imagens órfãs."),
    };
  }
}
