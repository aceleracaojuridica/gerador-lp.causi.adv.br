"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/app/actions/lps";
import { mapLpDbError } from "@/lib/errors";
import {
  deleteGalleryImage,
  type GalleryImageItem,
  listGalleryImages,
  uploadGalleryImage,
} from "@/lib/landing-pages/gallery-store";
import { requireLpSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    const mapped = mapLpDbError(err);
    return mapped.description || err.message;
  }
  return fallback;
}

export type GalleryImageDto = GalleryImageItem & {
  uploadedByName: string;
};

async function enrichWithUploaderNames(
  items: GalleryImageItem[],
): Promise<GalleryImageDto[]> {
  const userIds = [...new Set(items.map((i) => i.uploadedByUserId))];
  const nameById = new Map<string, string>();

  if (userIds.length > 0) {
    const causi = await createClient();
    const { data } = await causi
      .from("users")
      .select("id,name")
      .in("id", userIds);
    for (const row of data ?? []) {
      nameById.set(row.id as string, (row.name as string) || "Usuário");
    }
  }

  return items.map((item) => ({
    ...item,
    uploadedByName: nameById.get(item.uploadedByUserId) ?? "Usuário",
  }));
}

export async function listGalleryImagesAction(): Promise<
  { ok: true; images: GalleryImageDto[] } | { ok: false; error: string }
> {
  try {
    const session = await requireLpSession();
    const images = await listGalleryImages(session);
    const enriched = await enrichWithUploaderNames(images);
    return { ok: true, images: enriched };
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
