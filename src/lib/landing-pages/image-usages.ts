import "server-only";

import {
  createLpServiceClient,
  type LpDbClient,
} from "@/lib/supabase/lp-client";
import { isGeradorStorageUrl } from "./media-storage";
import type { LpSchema } from "./schema";

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

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

const SECTION_SLOT_RE = /^sections\.(hero|dor|sobre|solucao)$/;

/**
 * Marca em `lp_account_images.section_tags` a(s) seção(ões) em que uma imagem
 * da galeria já foi efetivamente usada (união com as tags existentes — nunca
 * remove uma tag antiga só porque a imagem deixou de ser usada ali agora).
 * É o único sinal de "para qual seção essa foto serve" que a galeria da conta
 * tem hoje; alimenta o pool de candidatos da IA em system-default-images.ts.
 *
 * Usa o cliente de service role: a policy de UPDATE de `lp_account_images`
 * só libera o uploader original de uma imagem SEM uso ainda — pelo desenho
 * atual, este sync roda logo depois de inserir o próprio uso que dispara a
 * tag, então bloquearia via RLS até para o uploader. Isto é um job de
 * sistema (bookkeeping automático no save), não uma escrita direta do
 * usuário, então o bypass de RLS é apropriado aqui.
 */
async function tagAccountImageSections(
  imageId: string,
  sections: string[],
): Promise<void> {
  if (sections.length === 0) return;

  const admin = createLpServiceClient();
  const { data, error: fetchError } = await admin
    .from("lp_account_images")
    .select("section_tags")
    .eq("id", imageId)
    .maybeSingle();
  if (fetchError) throwDbError(fetchError);

  const current = Array.isArray(data?.section_tags)
    ? (data.section_tags as string[])
    : [];
  const merged = Array.from(new Set([...current, ...sections]));
  if (merged.length === current.length) return;

  const { error: updateError } = await admin
    .from("lp_account_images")
    .update({ section_tags: merged })
    .eq("id", imageId);
  if (updateError) throwDbError(updateError);
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
  const sectionsByImageId = new Map<string, Set<string>>();

  for (const { slot, url } of slots) {
    const imageId = await resolveImageIdByUrl(db, url);
    if (imageId) {
      usages.push({
        image_id: imageId,
        landing_page_id: landingPageId,
        slot,
      });

      const sectionMatch = slot.match(SECTION_SLOT_RE);
      if (sectionMatch) {
        const set = sectionsByImageId.get(imageId) ?? new Set<string>();
        set.add(sectionMatch[1]);
        sectionsByImageId.set(imageId, set);
      }
    }
  }

  const { error: deleteError } = await db
    .from("lp_image_usages")
    .delete()
    .eq("landing_page_id", landingPageId);
  if (deleteError) throwDbError(deleteError);

  if (usages.length > 0) {
    const { error } = await db.from("lp_image_usages").insert(usages);
    if (error) throwDbError(error);
  }

  for (const [imageId, sections] of sectionsByImageId) {
    await tagAccountImageSections(imageId, [...sections]);
  }
}
