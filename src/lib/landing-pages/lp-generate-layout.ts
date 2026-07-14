import "server-only";

import OpenAI from "openai";
import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { DEFAULT_LAYOUT, type Layout, type Theme } from "./schema";
import { describeThemeMood } from "./system-default-images";
import {
  AREAS_VARIANT_OPTIONS,
  AREAS_VARIANTS,
  DOR_VARIANT_OPTIONS,
  DOR_VARIANTS,
  EQUIPE_VARIANT_OPTIONS,
  EQUIPE_VARIANTS,
  ETAPAS_VARIANT_OPTIONS,
  ETAPAS_VARIANTS,
  getAutoEquipeVariant,
  getAvailableEquipeVariants,
  HERO_VARIANT_CUTOUT_PORTRAIT,
  HERO_VARIANT_OPTIONS,
  HERO_VARIANT_STATS_AUTHORITY,
  HERO_VARIANTS,
  isEquipeVariantAllowed,
  normalizeAreasVariant,
  normalizeDorVariant,
  normalizeEquipeVariant,
  normalizeEtapasVariant,
  normalizeHeroVariant,
  normalizeSobreVariant,
  normalizeSolucaoVariant,
  SOBRE_VARIANT_OPTIONS,
  SOBRE_VARIANTS,
  SOLUCAO_VARIANT_OPTIONS,
  SOLUCAO_VARIANTS,
} from "./variants";

const toneSchema = z.enum(["light", "dark"]);

export const aiLayoutSchema = z.object({
  hero: z.enum(HERO_VARIANTS),
  dor: z.enum(DOR_VARIANTS),
  solucao: z.enum(SOLUCAO_VARIANTS),
  sobre: z.enum(SOBRE_VARIANTS),
  equipe: z.enum(EQUIPE_VARIANTS).nullable().optional(),
  areas: z.enum(AREAS_VARIANTS),
  etapas: z.enum(ETAPAS_VARIANTS),
  tones: z
    .object({
      hero: toneSchema.optional(),
      dor: toneSchema.optional(),
      solucao: toneSchema.optional(),
      sobre: toneSchema.optional(),
      equipe: toneSchema.optional(),
      areas: toneSchema.optional(),
      etapas: toneSchema.optional(),
      faq: toneSchema.optional(),
      ctaFinal: toneSchema.optional(),
    })
    .optional(),
});

export type LayoutChooseInput = {
  tema: string;
  about?: string;
  theme: Theme;
  lawyerCount: number;
  hasMetrics: boolean;
};

export type LayoutChooseResult = {
  layout: Layout;
  source: "ai" | "fallback";
};

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

function pickSeeded<T>(items: readonly T[], rand: () => number): T {
  return items[Math.floor(rand() * items.length)];
}

function describePalette(theme: Theme): string {
  return [
    `brand=${theme.brand}`,
    `brandDark=${theme.brandDark}`,
    `accent=${theme.accent}`,
    `cream=${theme.cream}`,
    `ink=${theme.ink}`,
  ].join(", ");
}

function serializeVariantMenu(
  options: ReadonlyArray<{ id: string; label: string; intent: string }>,
): string {
  return JSON.stringify(
    options.map((o) => ({ id: o.id, label: o.label, intent: o.intent })),
    null,
    2,
  );
}

function buildLabelToIdMap(
  options: ReadonlyArray<{ id: string; label: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const option of options) {
    map.set(option.id, option.id);
    map.set(option.label.toLowerCase(), option.id);
  }
  return map;
}

const HERO_LABEL_MAP = buildLabelToIdMap(HERO_VARIANT_OPTIONS);
const DOR_LABEL_MAP = buildLabelToIdMap(DOR_VARIANT_OPTIONS);
const SOLUCAO_LABEL_MAP = buildLabelToIdMap(SOLUCAO_VARIANT_OPTIONS);
const SOBRE_LABEL_MAP = buildLabelToIdMap(SOBRE_VARIANT_OPTIONS);
const EQUIPE_LABEL_MAP = buildLabelToIdMap(EQUIPE_VARIANT_OPTIONS);
const AREAS_LABEL_MAP = buildLabelToIdMap(AREAS_VARIANT_OPTIONS);
const ETAPAS_LABEL_MAP = buildLabelToIdMap(ETAPAS_VARIANT_OPTIONS);

function resolveVariantField(
  value: unknown,
  labelMap: Map<string, string>,
  normalize: (v: string | undefined) => string | undefined,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const normalized = normalize(trimmed);
  if (normalized) return normalized;
  return labelMap.get(trimmed.toLowerCase());
}

function normalizeTone(value: unknown): "light" | "dark" | undefined {
  if (value === "light" || value === "dark") return value;
  return undefined;
}

/** Normaliza resposta bruta da IA (labels, legacy IDs, campos omitidos). */
export function normalizeAiLayoutJson(
  raw: unknown,
  lawyerCount: number,
): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const input = raw as Record<string, unknown>;
  const tonesRaw =
    input.tones && typeof input.tones === "object"
      ? (input.tones as Record<string, unknown>)
      : {};

  const equipeResolved =
    lawyerCount === 0
      ? null
      : resolveVariantField(
          input.equipe,
          EQUIPE_LABEL_MAP,
          normalizeEquipeVariant,
        );

  return {
    hero: resolveVariantField(input.hero, HERO_LABEL_MAP, normalizeHeroVariant),
    dor: resolveVariantField(input.dor, DOR_LABEL_MAP, normalizeDorVariant),
    solucao: resolveVariantField(
      input.solucao,
      SOLUCAO_LABEL_MAP,
      normalizeSolucaoVariant,
    ),
    sobre: resolveVariantField(
      input.sobre,
      SOBRE_LABEL_MAP,
      normalizeSobreVariant,
    ),
    equipe: equipeResolved ?? null,
    areas: resolveVariantField(
      input.areas,
      AREAS_LABEL_MAP,
      normalizeAreasVariant,
    ),
    etapas: resolveVariantField(
      input.etapas,
      ETAPAS_LABEL_MAP,
      normalizeEtapasVariant,
    ),
    tones: {
      hero: normalizeTone(tonesRaw.hero),
      dor: normalizeTone(tonesRaw.dor),
      solucao: normalizeTone(tonesRaw.solucao),
      sobre: normalizeTone(tonesRaw.sobre),
      equipe: normalizeTone(tonesRaw.equipe),
      areas: normalizeTone(tonesRaw.areas),
      etapas: normalizeTone(tonesRaw.etapas),
      faq: normalizeTone(tonesRaw.faq),
      ctaFinal: normalizeTone(tonesRaw.ctaFinal),
    },
  };
}

function buildLayoutPrompt(input: LayoutChooseInput): string {
  const equipeVariants = getAvailableEquipeVariants(input.lawyerCount);
  const equipeMenu =
    equipeVariants.length > 0
      ? serializeVariantMenu(
          EQUIPE_VARIANT_OPTIONS.filter((o) => equipeVariants.includes(o.id)),
        )
      : null;

  const mood = describeThemeMood(input.theme);

  const lines = [
    "Escolha a combinação de variantes e tons (claro/escuro) que melhor serve esta landing page jurídica.",
    "Use APENAS o campo `id` de cada opção do menu — NUNCA use `label` ou `intent` como valor.",
    "Adapte a combinação ao tema e à paleta; evite repetir sempre a mesma combinação genérica.",
    "",
    `Tema da página: ${input.tema}`,
    input.about ? `Sobre o escritório: ${input.about}` : "",
    `Paleta extraída da logo: ${describePalette(input.theme)}`,
    `Clima visual da paleta: ${mood}`,
    "",
    "HEURÍSTICAS (orientação, não obrigação):",
    `- Paleta sóbria/escura (${mood}): considere hero split ou sobre overlay; alterne tons dark em solucao/areas.`,
    `- Paleta clara/calorosa: hero centralizado ou cutout podem funcionar bem.`,
    input.hasMetrics
      ? `- Métricas reais cadastradas: prefira hero com métricas (${HERO_VARIANT_STATS_AUTHORITY}).`
      : "",
    input.lawyerCount === 1
      ? `- Um advogado: prefira hero cutout (${HERO_VARIANT_CUTOUT_PORTRAIT}) e equipe solo.`
      : "",
    input.lawyerCount === 0
      ? "- Sem advogados na equipe — use equipe: null."
      : input.lawyerCount === 1
        ? "- Um advogado — equipe deve usar variant solo."
        : `- ${input.lawyerCount} advogados — escolha variant de equipe adequada ao tamanho.`,
    "",
    "MENU HERO:",
    serializeVariantMenu(HERO_VARIANT_OPTIONS),
    "",
    "MENU DOR:",
    serializeVariantMenu(DOR_VARIANT_OPTIONS),
    "",
    "MENU SOLUÇÃO:",
    serializeVariantMenu(SOLUCAO_VARIANT_OPTIONS),
    "",
    "MENU SOBRE:",
    serializeVariantMenu(SOBRE_VARIANT_OPTIONS),
  ];

  if (equipeMenu) {
    lines.push("", "MENU EQUIPE:", equipeMenu);
  }

  lines.push(
    "",
    "MENU ÁREAS:",
    serializeVariantMenu(AREAS_VARIANT_OPTIONS),
    "",
    "MENU ETAPAS:",
    serializeVariantMenu(ETAPAS_VARIANT_OPTIONS),
    "",
    "Para cada seção, escolha também o tom de fundo: light ou dark.",
    "Busque alternância visual agradável e coerência com o tema e a paleta.",
  );

  return lines.filter(Boolean).join("\n");
}

function parsedToLayout(
  parsed: z.infer<typeof aiLayoutSchema>,
  lawyerCount: number,
): Layout {
  const equipe =
    lawyerCount === 0
      ? undefined
      : parsed.equipe && isEquipeVariantAllowed(lawyerCount, parsed.equipe)
        ? parsed.equipe
        : getAutoEquipeVariant(lawyerCount);

  return {
    hero: parsed.hero,
    dor: parsed.dor,
    solucao: parsed.solucao,
    sobre: parsed.sobre,
    equipe,
    areas: parsed.areas,
    etapas: parsed.etapas,
    tones: {
      ...DEFAULT_LAYOUT.tones,
      ...parsed.tones,
    },
    hidden: { ...DEFAULT_LAYOUT.hidden },
  };
}

function parseAiLayoutJson(
  raw: unknown,
  lawyerCount: number,
): z.infer<typeof aiLayoutSchema> {
  const normalized = normalizeAiLayoutJson(raw, lawyerCount);
  return aiLayoutSchema.parse(normalized);
}

/** Fallback com variação seeded por tema/paleta quando a IA falha. */
export function chooseLayoutDeterministic(input: LayoutChooseInput): Layout {
  const seed = `${input.tema}:${input.theme.brand}:${input.lawyerCount}`;
  const rand = seededRandom(seed);

  const layout: Layout = {
    hero: pickSeeded(HERO_VARIANTS, rand),
    dor: pickSeeded(DOR_VARIANTS, rand),
    solucao: pickSeeded(SOLUCAO_VARIANTS, rand),
    sobre: pickSeeded(SOBRE_VARIANTS, rand),
    equipe: getAutoEquipeVariant(input.lawyerCount),
    areas: pickSeeded(AREAS_VARIANTS, rand),
    etapas: pickSeeded(ETAPAS_VARIANTS, rand),
    tones: {
      hero: pickSeeded(["light", "dark"] as const, rand),
      dor: pickSeeded(["light", "dark"] as const, rand),
      solucao: pickSeeded(["light", "dark"] as const, rand),
      sobre: pickSeeded(["light", "dark"] as const, rand),
      equipe: pickSeeded(["light", "dark"] as const, rand),
      areas: pickSeeded(["light", "dark"] as const, rand),
      etapas: pickSeeded(["light", "dark"] as const, rand),
      faq: pickSeeded(["light", "dark"] as const, rand),
      ctaFinal: pickSeeded(["light", "dark"] as const, rand),
    },
    hidden: { ...DEFAULT_LAYOUT.hidden },
  };

  return layout;
}

function logLayoutFallback(err: unknown, raw?: string): void {
  if (process.env.NODE_ENV !== "development") return;
  console.error(
    "[chooseLayoutWithAi] fallback:",
    err instanceof Error ? err.message : err,
    raw?.slice(0, 500),
  );
}

/** Escolhe variantes e tons via IA; cai no fallback seeded em qualquer erro. */
export async function chooseLayoutWithAi(
  apiKey: string,
  input: LayoutChooseInput,
): Promise<LayoutChooseResult> {
  let raw = "{}";
  try {
    const client = new OpenAI({ apiKey });
    const completion = await client.chat.completions.create({
      model: getServerEnv().OPENAI_MODEL,
      max_tokens: 800,
      temperature: 0.7,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lp_layout",
          schema: z.toJSONSchema(aiLayoutSchema),
          strict: true,
        },
      },
      messages: [
        {
          role: "system",
          content:
            "Você é designer de landing pages jurídicas brasileiras. Escolhe variantes e tons entre opções fixas. Responda apenas com JSON válido usando somente os IDs do menu.",
        },
        { role: "user", content: buildLayoutPrompt(input) },
      ],
    });

    raw = completion.choices[0]?.message?.content ?? "{}";
    const json = JSON.parse(raw) as unknown;
    const parsed = parseAiLayoutJson(json, input.lawyerCount);
    const layout = parsedToLayout(parsed, input.lawyerCount);
    return { layout, source: "ai" };
  } catch (err) {
    logLayoutFallback(err, raw);
    return {
      layout: chooseLayoutDeterministic(input),
      source: "fallback",
    };
  }
}
