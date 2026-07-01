import "server-only";

import type { LpDbClient } from "@/lib/supabase/lp-client";
import { isGeradorStorageUrl } from "./media-storage";
import type { LpSchema } from "./schema";

export type ImageSlotUsage = {
  slot: string;
  url: string;
};

/** Extrai slots de imagem do schema da LP. */
export function extractImageSlotsFromSchema(
  schema: LpSchema,
): ImageSlotUsage[] {
  const slots: ImageSlotUsage[] = [];
  const office = schema.office;

  if (office.logoSrc?.trim()) {
    slots.push({ slot: "logo", url: office.logoSrc.trim() });
  }

  for (const lawyer of office.lawyers) {
    if (!lawyer.photo?.trim()) continue;
    const id =
      lawyer.photo.match(/\/lawyers\/([^./]+)\.webp/i)?.[1] ??
      lawyer.photo.match(/\/gallery\/([^./]+)\.webp/i)?.[1] ??
      `lawyer-${slots.length}`;
    slots.push({ slot: `lawyers.${id}`, url: lawyer.photo.trim() });
  }

  for (const [key, url] of Object.entries(office.sectionImages ?? {})) {
    if (url?.trim()) {
      slots.push({ slot: `sections.${key}`, url: url.trim() });
    }
  }

  if (schema.seo?.ogImage?.trim()) {
    slots.push({ slot: "seo.ogImage", url: schema.seo.ogImage.trim() });
  }
  if (schema.seo?.favicon?.trim()) {
    slots.push({ slot: "seo.favicon", url: schema.seo.favicon.trim() });
  }

  return slots;
}

/** Resolve image_id a partir da URL pública do bucket (galeria). */
async function resolveImageIdByUrl(
  db: LpDbClient,
  url: string,
): Promise<string | null> {
  if (!isGeradorStorageUrl(url)) return null;

  const pathMatch = url.match(/\/gerador-lp-assets\/(.+)$/);
  if (!pathMatch) return null;
  const storagePath = decodeURIComponent(pathMatch[1]);

  const { data } = await db
    .from("lp_account_images")
    .select("id")
    .eq("storage_path", storagePath)
    .maybeSingle();

  return (data?.id as string | undefined) ?? null;
}

/**
 * Sincroniza `lp_image_usages` com as URLs de galeria presentes no schema.
 * URLs legadas (paths por LP) não geram vínculo na galeria.
 */
export async function syncImageUsagesFromSchema(
  db: LpDbClient,
  landingPageId: string,
  schema: LpSchema,
): Promise<void> {
  const slots = extractImageSlotsFromSchema(schema);
  const usages: { image_id: string; landing_page_id: string; slot: string }[] =
    [];

  for (const { slot, url } of slots) {
    const imageId = await resolveImageIdByUrl(db, url);
    if (imageId) {
      usages.push({
        image_id: imageId,
        landing_page_id: landingPageId,
        slot,
      });
    }
  }

  await db
    .from("lp_image_usages")
    .delete()
    .eq("landing_page_id", landingPageId);

  if (usages.length > 0) {
    const { error } = await db.from("lp_image_usages").insert(usages);
    if (error) throw error;
  }
}
