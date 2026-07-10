import "server-only";

import OpenAI from "openai";
import type { Session } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { sortCandidatesDeterministically } from "./gallery-filters";
import { getPublicMediaUrl } from "./media-storage";
import type { Theme } from "./schema";
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
  /** Tags de seção da galeria da conta (vazio no catálogo de sistema). */
  sectionTags?: string[];
  sortOrder: number;
  createdAt: string;
  /** "system" = catálogo curado global; "account" = galeria da própria conta. */
  source?: "system" | "account";
};

function normalizeSectionKey(value: string): SectionImageKey | null {
  if (
    value === "hero" ||
    value === "dor" ||
    value === "sobre" ||
    value === "solucao"
  ) {
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
    .map((row): SystemGalleryImageItem | null => {
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
        source: "system",
      };
    })
    .filter((item): item is SystemGalleryImageItem => item !== null);
}

type AccountImageRow = {
  id: string;
  storage_path: string;
  original_filename: string | null;
  section_tags: unknown;
  created_at: string;
};

/**
 * Lista as imagens da galeria da PRÓPRIA conta autenticada (nunca de outras
 * contas — escopo explícito por `account_id`, além do RLS) já expandidas em
 * um candidato por seção marcada em `section_tags` (ex: uma foto usada em
 * hero e sobre gera 2 candidatos, um por seção). Cada candidato recebe um id
 * composto (`account:<imageId>:<section>`) para nunca colidir com outro
 * candidato da mesma imagem numa seção diferente ao montar o pool combinado.
 */
export async function listAccountImagesForRanking(
  session: Session,
): Promise<SystemGalleryImageItem[]> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);
  const { data, error } = await db
    .from("lp_account_images")
    .select("id, storage_path, original_filename, section_tags, created_at")
    .eq("account_id", ctx.accountId);

  if (error) {
    throw Object.assign(new Error(error.message), { code: error.code });
  }
  if (!data) return [];

  const items: SystemGalleryImageItem[] = [];
  for (const row of data as AccountImageRow[]) {
    const taggedSections = normalizeSemanticTags(row.section_tags).filter(
      (tag): tag is SectionImageKey => normalizeSectionKey(tag) !== null,
    );
    // Sem section_tags a imagem ainda não foi usada em nenhuma seção — não
    // oferecer em todas as seções (ex.: logo virava candidata a dor/sobre/solução).
    if (taggedSections.length === 0) continue;

    const baseLabel =
      row.original_filename?.replace(/\.[^.]+$/, "").trim() ||
      "Foto da galeria";

    for (const sectionKey of taggedSections) {
      items.push({
        id: `account:${row.id}:${sectionKey}`,
        storagePath: row.storage_path,
        url: getPublicMediaUrl(row.storage_path),
        sectionKey,
        label: baseLabel,
        semanticTags: taggedSections,
        sectionTags: taggedSections,
        sortOrder: 0,
        createdAt: row.created_at,
        source: "account",
      });
    }
  }
  return items;
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
    const chosen = pickOne(
      filtered.length > 0 ? filtered : rankedUrlPool,
      rand,
    );
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
  paletteHint?: string;
  catalog: SystemGalleryImageItem[];
};

/** Classifica a paleta extraída da logo em rótulos de clima visual para o ranker. */
export function describeThemeMood(theme: Theme): string {
  const hex = theme.brand.replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  const n = Number.parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2 / 255;

  let hue = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }

  const warmth =
    hue >= 15 && hue <= 55
      ? "caloroso"
      : hue >= 180 && hue <= 250
        ? "sóbrio"
        : hue >= 90 && hue <= 170
          ? "moderno"
          : l < 0.35
            ? "sóbrio"
            : "neutro";

  const lightness =
    l < 0.4
      ? "paleta escura"
      : l > 0.65
        ? "paleta clara"
        : "paleta equilibrada";

  return `${warmth}, ${lightness}`;
}

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

function buildRankerPrompt(
  theme: string,
  catalog: SystemGalleryImageItem[],
  paletteHint?: string,
): string {
  const candidateList = catalog.map((item) => ({
    id: item.id,
    sectionKey: item.sectionKey,
    label: item.label,
    semanticTags: item.semanticTags,
    sectionTags: item.sectionTags ?? [],
    source: item.source ?? "system",
  }));
  return [
    "Tema da landing page:",
    theme,
    paletteHint ? `Clima da paleta de cores: ${paletteHint}` : "",
    "",
    "Candidatos (JSON):",
    JSON.stringify(candidateList),
    "",
    "Retorne JSON com arrays por seção ordenados por maior relevância semântica.",
    "Prefira imagens com contraste e clima visual compatíveis com a paleta quando possível.",
    "Use apenas IDs fornecidos e mantenha cada id apenas na seção correspondente.",
    'Formato: {"hero":["id"],"dor":["id"],"sobre":["id"],"solucao":["id"]}',
  ]
    .filter(Boolean)
    .join("\n");
}

async function rankSystemImagesByAi({
  apiKey,
  theme,
  paletteHint,
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
      {
        role: "user",
        content: buildRankerPrompt(theme, catalog, paletteHint),
      },
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

/**
 * Escolhe a imagem de cada seção a partir de um pool de candidatos que pode
 * combinar o catálogo global de sistema (`listSystemGalleryImages`) com a
 * galeria da própria conta (`listAccountImagesForRanking`) — o chamador
 * decide o que entra em `catalog`. Nunca há prioridade fixa de origem: a IA
 * (com fallback determinístico) escolhe entre todos os candidatos elegíveis
 * para aquela seção, seja do sistema ou da conta.
 */
export async function pickSystemImagesWithAiRanking(input: {
  apiKey: string;
  theme: string;
  paletteHint?: string;
  catalog: SystemGalleryImageItem[];
  seedInput: string;
}): Promise<SectionImages> {
  const { apiKey, theme, paletteHint, catalog, seedInput } = input;
  try {
    const ranked = await rankSystemImagesByAi({
      apiKey,
      theme,
      paletteHint,
      catalog,
    });
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
