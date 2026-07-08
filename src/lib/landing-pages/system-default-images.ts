import "server-only";

import OpenAI from "openai";
import type { Session } from "@/lib/session";
import { createLpUserClient } from "@/lib/supabase/lp-client";
import { sortCandidatesDeterministically } from "./gallery-filters";
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
  semantic_tags: unknown;
  sort_order: number;
  created_at: string;
};

export type SystemGalleryImageItem = {
  id: string;
  storagePath: string;
  url: string;
  sectionKey: SectionImageKey;
  label: string;
  semanticTags: string[];
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

function normalizeSemanticTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((tag): tag is string => typeof tag === "string");
}

export async function listSystemGalleryImages(
  session: Session,
): Promise<SystemGalleryImageItem[]> {
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("lp_system_images")
    .select(
      "id,storage_path,public_url,section_key,label,semantic_tags,sort_order,created_at",
    )
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
        semanticTags: normalizeSemanticTags(row.semantic_tags),
        sortOrder: Number(row.sort_order ?? 0),
        createdAt: row.created_at,
      } satisfies SystemGalleryImageItem;
    })
    .filter((item): item is SystemGalleryImageItem => item !== null);
}

export function pickDefaultSystemImages(
  catalog: SystemGalleryImageItem[],
  seedInput: string,
  semanticTheme = "",
): SectionImages {
  const grouped = new Map<SectionImageKey, SystemGalleryImageItem[]>();
  for (const key of SECTION_IMAGE_KEYS) grouped.set(key, []);
  for (const image of catalog) {
    grouped.get(image.sectionKey)?.push(image);
  }

  const rand = seededRandom(seedInput);
  const selected: SectionImages = { ...EMPTY_SECTION_IMAGES };
  const used = new Set<string>();

  for (const key of SECTION_IMAGE_KEYS) {
    const pool = grouped.get(key) ?? [];
    const ranked = sortCandidatesDeterministically(
      pool.map((item) => ({
        id: item.id,
        sectionKey: item.sectionKey,
        label: item.label,
        semanticTags: item.semanticTags,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt,
      })),
      semanticTheme,
      `${seedInput}:${key}`,
    );
    const rankedUrlPool = ranked
      .map((candidate) => pool.find((item) => item.id === candidate.id)?.url)
      .filter((url): url is string => Boolean(url));
    const filtered = rankedUrlPool.filter((url) => !used.has(url));
    const chosen = pickOne(filtered.length > 0 ? filtered : rankedUrlPool, rand);
    if (chosen) {
      selected[key] = chosen;
      used.add(chosen);
    }
  }

  return selected;
}

type RankedSystemSelection = {
  hero: string[];
  dor: string[];
  sobre: string[];
  solucao: string[];
};

type RankByAiInput = {
  apiKey: string;
  theme: string;
  catalog: SystemGalleryImageItem[];
};

function ensureSectionRanks(value: unknown): RankedSystemSelection {
  const parsed = (value ?? {}) as Record<string, unknown>;
  const toArray = (key: SectionImageKey): string[] => {
    const arr = parsed[key];
    if (!Array.isArray(arr)) return [];
    return arr.filter((id): id is string => typeof id === "string");
  };
  return {
    hero: toArray("hero"),
    dor: toArray("dor"),
    sobre: toArray("sobre"),
    solucao: toArray("solucao"),
  };
}

function buildRankerPrompt(theme: string, catalog: SystemGalleryImageItem[]): string {
  const candidateList = catalog.map((item) => ({
    id: item.id,
    sectionKey: item.sectionKey,
    label: item.label,
    semanticTags: item.semanticTags,
  }));
  return [
    "Tema da landing page:",
    theme,
    "",
    "Candidatos (JSON):",
    JSON.stringify(candidateList),
    "",
    "Retorne JSON com arrays por seção ordenados por maior relevância semântica.",
    "Use apenas IDs fornecidos e mantenha cada id apenas na seção correspondente.",
    'Formato: {"hero":["id"],"dor":["id"],"sobre":["id"],"solucao":["id"]}',
  ].join("\n");
}

async function rankSystemImagesByAi({
  apiKey,
  theme,
  catalog,
}: RankByAiInput): Promise<RankedSystemSelection> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Você é um ranker semântico de imagens de landing page jurídica. Responda apenas com JSON válido.",
      },
      { role: "user", content: buildRankerPrompt(theme, catalog) },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return ensureSectionRanks(JSON.parse(raw));
}

function selectFromRankedIds(
  rankedIds: RankedSystemSelection,
  catalog: SystemGalleryImageItem[],
): SectionImages {
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const selected: SectionImages = { ...EMPTY_SECTION_IMAGES };
  const used = new Set<string>();

  for (const key of SECTION_IMAGE_KEYS) {
    const ids = rankedIds[key];
    for (const id of ids) {
      const item = byId.get(id);
      if (!item || item.sectionKey !== key || used.has(item.url)) continue;
      selected[key] = item.url;
      used.add(item.url);
      break;
    }
  }

  return selected;
}

export async function pickSystemImagesWithAiRanking(input: {
  apiKey: string;
  theme: string;
  catalog: SystemGalleryImageItem[];
  seedInput: string;
}): Promise<SectionImages> {
  const { apiKey, theme, catalog, seedInput } = input;
  try {
    const ranked = await rankSystemImagesByAi({ apiKey, theme, catalog });
    const aiSelected = selectFromRankedIds(ranked, catalog);
    const deterministic = pickDefaultSystemImages(catalog, seedInput, theme);
    return {
      hero: aiSelected.hero || deterministic.hero,
      dor: aiSelected.dor || deterministic.dor,
      sobre: aiSelected.sobre || deterministic.sobre,
      solucao: aiSelected.solucao || deterministic.solucao,
    };
  } catch {
    return pickDefaultSystemImages(catalog, seedInput, theme);
  }
}
