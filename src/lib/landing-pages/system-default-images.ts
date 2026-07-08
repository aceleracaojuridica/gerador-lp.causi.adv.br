import "server-only";

import type { Session } from "@/lib/session";
import { createLpUserClient } from "@/lib/supabase/lp-client";
import { getPublicMediaUrl } from "./media-storage";
import {
  EMPTY_SECTION_IMAGES,
  SECTION_IMAGE_KEYS,
  type SectionImageKey,
  type SectionImages,
} from "./section-images";

type SystemImageRow = {
  id: string;
  storage_path: string;
  public_url: string;
  section_key: string;
  label: string;
  sort_order: number;
  created_at: string;
};

export type SystemGalleryImageItem = {
  id: string;
  storagePath: string;
  url: string;
  sectionKey: SectionImageKey;
  label: string;
  sortOrder: number;
  createdAt: string;
};

function normalizeSectionKey(value: string): SectionImageKey | null {
  if (value === "hero" || value === "dor" || value === "sobre" || value === "solucao") {
    return value;
  }
  return null;
}

function seededRandom(seedText: string): () => number {
  let seed = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
  }
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function pickOne<T>(items: T[], rand: () => number): T | undefined {
  if (items.length === 0) return undefined;
  const idx = Math.floor(rand() * items.length);
  return items[idx];
}

export async function listSystemGalleryImages(
  session: Session,
): Promise<SystemGalleryImageItem[]> {
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("lp_system_images")
    .select("id,storage_path,public_url,section_key,label,sort_order,created_at")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw Object.assign(new Error(error.message), { code: error.code });
  }
  if (!data) return [];

  return (data as SystemImageRow[])
    .map((row) => {
      const sectionKey = normalizeSectionKey(row.section_key);
      if (!sectionKey) return null;
      return {
        id: row.id,
        storagePath: row.storage_path,
        url: row.public_url || getPublicMediaUrl(row.storage_path),
        sectionKey,
        label: row.label || "Imagem do sistema",
        sortOrder: Number(row.sort_order ?? 0),
        createdAt: row.created_at,
      } satisfies SystemGalleryImageItem;
    })
    .filter((item): item is SystemGalleryImageItem => item !== null);
}

export function pickDefaultSystemImages(
  catalog: SystemGalleryImageItem[],
  seedInput: string,
): SectionImages {
  const grouped = new Map<SectionImageKey, string[]>();
  for (const key of SECTION_IMAGE_KEYS) grouped.set(key, []);
  for (const image of catalog) {
    grouped.get(image.sectionKey)?.push(image.url);
  }

  const rand = seededRandom(seedInput);
  const selected: SectionImages = { ...EMPTY_SECTION_IMAGES };
  const used = new Set<string>();

  for (const key of SECTION_IMAGE_KEYS) {
    const pool = grouped.get(key) ?? [];
    const filtered = pool.filter((url) => !used.has(url));
    const chosen = pickOne(filtered.length > 0 ? filtered : pool, rand);
    if (chosen) {
      selected[key] = chosen;
      used.add(chosen);
    }
  }

  return selected;
}
