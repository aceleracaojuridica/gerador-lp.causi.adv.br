type VariantOption<TId extends string> = {
  id: TId;
  label: string;
  intent: string;
  legacyIds?: readonly string[];
};

function buildVariantLabels<TId extends string>(
  options: readonly VariantOption<TId>[],
): Record<TId, string> {
  return Object.fromEntries(
    options.map((option) => [option.id, option.label]),
  ) as Record<TId, string>;
}

function buildVariantLookup<TId extends string>(
  options: readonly VariantOption<TId>[],
): Record<string, TId> {
  return Object.fromEntries(
    options.flatMap((option) => [
      [option.id, option.id],
      ...(option.legacyIds ?? []).map((legacyId) => [legacyId, option.id]),
    ]),
  ) as Record<string, TId>;
}

function normalizeVariantId<TId extends string>(
  value: string | undefined,
  lookup: Record<string, TId>,
): TId | undefined {
  if (!value) return undefined;
  return lookup[value];
}

export const HERO_VARIANT_CENTERED_FOCUS =
  "causi_lp_section_hero_centered_focus" as const;
export const HERO_VARIANT_SPLIT_MEDIA =
  "causi_lp_section_hero_split_media" as const;
export const HERO_VARIANT_STATS_AUTHORITY =
  "causi_lp_section_hero_stats_authority" as const;
export const HERO_VARIANT_CUTOUT_PORTRAIT =
  "causi_lp_section_hero_cutout_portrait" as const;

/**
 * Variante aposentada: o vídeo saiu do Topo e passou a viver numa seção própria
 * logo abaixo dele. Os ids só sobrevivem para a migração reconhecer LPs antigas
 * (ver `migrate` em lp-store.ts) — não são mais opções no editor.
 */
export const LEGACY_HERO_VIDEO_IDS = [
  "causi_lp_section_hero_video_embedded",
  "video",
] as const;

export function isLegacyHeroVideoVariant(value: string | undefined): boolean {
  if (!value) return false;
  return (LEGACY_HERO_VIDEO_IDS as readonly string[]).includes(value);
}

/** Topo que as LPs com vídeo no hero herdam ao migrar. */
export const HERO_VARIANT_VIDEO_FALLBACK = HERO_VARIANT_SPLIT_MEDIA;

export const HERO_VARIANTS = [
  HERO_VARIANT_CENTERED_FOCUS,
  HERO_VARIANT_SPLIT_MEDIA,
  HERO_VARIANT_STATS_AUTHORITY,
  HERO_VARIANT_CUTOUT_PORTRAIT,
] as const;

export type HeroVariant = (typeof HERO_VARIANTS)[number];

export const HERO_VARIANT_OPTIONS: readonly VariantOption<HeroVariant>[] = [
  {
    id: HERO_VARIANT_CENTERED_FOCUS,
    label: "Centralizado",
    intent: "Destaca a mensagem principal sem competir com mídia lateral.",
    legacyIds: ["centered"],
  },
  {
    id: HERO_VARIANT_SPLIT_MEDIA,
    label: "Split 50/50",
    intent: "Equilibra texto e mídia com leitura rápida.",
    legacyIds: ["split"],
  },
  {
    id: HERO_VARIANT_STATS_AUTHORITY,
    label: "Com métricas",
    intent: "Reforça autoridade com números e prova objetiva.",
    legacyIds: ["stats"],
  },
  {
    id: HERO_VARIANT_CUTOUT_PORTRAIT,
    label: "Recorte",
    intent: "Valoriza o retrato do advogado sobre cena institucional.",
    legacyIds: ["recorte"],
  },
] as const;

export const HERO_VARIANT_LABELS = buildVariantLabels(HERO_VARIANT_OPTIONS);

const HERO_VARIANT_LOOKUP = buildVariantLookup(HERO_VARIANT_OPTIONS);

export function normalizeHeroVariant(
  value: string | undefined,
): HeroVariant | undefined {
  return normalizeVariantId(value, HERO_VARIANT_LOOKUP);
}

export const DOR_VARIANT_WITH_IMAGE_CARDS =
  "causi_lp_section_dor_with_image_cards" as const;
export const DOR_VARIANT_IMAGE_ICON_LIST =
  "causi_lp_section_dor_image_icon_list" as const;
export const DOR_VARIANT_IMAGE_LIST =
  "causi_lp_section_dor_image_list" as const;

export const DOR_VARIANTS = [
  DOR_VARIANT_WITH_IMAGE_CARDS,
  DOR_VARIANT_IMAGE_ICON_LIST,
  DOR_VARIANT_IMAGE_LIST,
] as const;

export type DorVariant = (typeof DOR_VARIANTS)[number];

export const DOR_VARIANT_OPTIONS: readonly VariantOption<DorVariant>[] = [
  {
    id: DOR_VARIANT_WITH_IMAGE_CARDS,
    label: "Com imagem",
    intent: "Combina contexto visual com cards das dores.",
    legacyIds: ["comImagem"],
  },
  {
    id: DOR_VARIANT_IMAGE_ICON_LIST,
    label: "Imagem + itens",
    intent:
      "Imagem à esquerda; título, texto e as dores como itens com ícone (2 colunas).",
    legacyIds: ["soCards", "causi_lp_section_dor_cards_compact"],
  },
  {
    id: DOR_VARIANT_IMAGE_LIST,
    label: "Lista",
    intent: "Dores em lista enxuta (2 colunas, sem ícones) ao lado da imagem.",
  },
] as const;

export const DOR_VARIANT_LABELS = buildVariantLabels(DOR_VARIANT_OPTIONS);

const DOR_VARIANT_LOOKUP = buildVariantLookup(DOR_VARIANT_OPTIONS);

export function normalizeDorVariant(
  value: string | undefined,
): DorVariant | undefined {
  return normalizeVariantId(value, DOR_VARIANT_LOOKUP);
}

export const SOLUCAO_VARIANT_WITH_IMAGE_CARDS =
  "causi_lp_section_solucao_with_image_cards" as const;
export const SOLUCAO_VARIANT_IMAGE_ICON_LIST =
  "causi_lp_section_solucao_image_icon_list" as const;
export const SOLUCAO_VARIANT_IMAGE_LIST =
  "causi_lp_section_solucao_image_list" as const;

export const SOLUCAO_VARIANTS = [
  SOLUCAO_VARIANT_WITH_IMAGE_CARDS,
  SOLUCAO_VARIANT_IMAGE_ICON_LIST,
  SOLUCAO_VARIANT_IMAGE_LIST,
] as const;

export type SolucaoVariant = (typeof SOLUCAO_VARIANTS)[number];

export const SOLUCAO_VARIANT_OPTIONS: readonly VariantOption<SolucaoVariant>[] =
  [
    {
      id: SOLUCAO_VARIANT_WITH_IMAGE_CARDS,
      label: "Com imagem",
      intent: "Explica a solução com apoio visual e cards.",
      legacyIds: ["comImagem"],
    },
    {
      id: SOLUCAO_VARIANT_IMAGE_ICON_LIST,
      label: "Imagem + itens",
      intent:
        "Imagem à esquerda; título, texto e a solução como itens com ícone (2 colunas).",
      legacyIds: ["soCards", "causi_lp_section_solucao_cards_compact"],
    },
    {
      id: SOLUCAO_VARIANT_IMAGE_LIST,
      label: "Lista",
      intent:
        "Solução em lista enxuta (2 colunas, sem ícones) ao lado da imagem.",
      legacyIds: ["destaque", "causi_lp_section_solucao_cards_highlight"],
    },
  ] as const;

export const SOLUCAO_VARIANT_LABELS = buildVariantLabels(
  SOLUCAO_VARIANT_OPTIONS,
);

const SOLUCAO_VARIANT_LOOKUP = buildVariantLookup(SOLUCAO_VARIANT_OPTIONS);

export function normalizeSolucaoVariant(
  value: string | undefined,
): SolucaoVariant | undefined {
  return normalizeVariantId(value, SOLUCAO_VARIANT_LOOKUP);
}

export const SOBRE_VARIANT_OVERLAY_PORTRAIT =
  "causi_lp_section_sobre_overlay_portrait" as const;
export const SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT =
  "causi_lp_section_sobre_two_columns_portrait" as const;
export const SOBRE_VARIANT_PHOTO_LIST =
  "causi_lp_section_sobre_photo_list" as const;

export const SOBRE_VARIANTS = [
  SOBRE_VARIANT_OVERLAY_PORTRAIT,
  SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT,
  SOBRE_VARIANT_PHOTO_LIST,
] as const;

export type SobreVariant = (typeof SOBRE_VARIANTS)[number];

export const SOBRE_VARIANT_OPTIONS: readonly VariantOption<SobreVariant>[] = [
  {
    id: SOBRE_VARIANT_PHOTO_LIST,
    label: "Foto + lista",
    intent: "Combina retrato principal com diferenciais em lista.",
    legacyIds: ["fotoLista"],
  },
  {
    id: SOBRE_VARIANT_OVERLAY_PORTRAIT,
    label: "Imagem + overlay",
    intent: "Sobrepõe texto ao retrato para um bloco institucional marcante.",
    legacyIds: ["overlay"],
  },
  {
    id: SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT,
    label: "Duas colunas",
    intent: "Separa retrato e texto em colunas equilibradas.",
    legacyIds: ["duasColunas"],
  },
] as const;

export const SOBRE_VARIANT_LABELS = buildVariantLabels(SOBRE_VARIANT_OPTIONS);

const SOBRE_VARIANT_LOOKUP = buildVariantLookup(SOBRE_VARIANT_OPTIONS);

export function normalizeSobreVariant(
  value: string | undefined,
): SobreVariant | undefined {
  return normalizeVariantId(value, SOBRE_VARIANT_LOOKUP);
}

export const EQUIPE_VARIANT_SPLIT_ALTERNATING =
  "causi_lp_section_equipe_split_alternating" as const;
export const EQUIPE_VARIANT_PORTRAIT_GRID =
  "causi_lp_section_equipe_portrait_grid" as const;
export const EQUIPE_VARIANT_SOLO_PORTRAIT =
  "causi_lp_section_equipe_solo_portrait" as const;

export const EQUIPE_VARIANTS = [
  EQUIPE_VARIANT_SPLIT_ALTERNATING,
  EQUIPE_VARIANT_PORTRAIT_GRID,
  EQUIPE_VARIANT_SOLO_PORTRAIT,
] as const;

export type EquipeVariant = (typeof EQUIPE_VARIANTS)[number];

export const EQUIPE_VARIANT_OPTIONS: readonly VariantOption<EquipeVariant>[] = [
  {
    id: EQUIPE_VARIANT_SPLIT_ALTERNATING,
    label: "Split alternado",
    intent: "Alterna retrato e texto para equipes enxutas.",
    legacyIds: ["splitAlternado"],
  },
  {
    id: EQUIPE_VARIANT_PORTRAIT_GRID,
    label: "Retrato elegante",
    intent: "Mostra vários retratos em grade com leitura rápida.",
    legacyIds: ["retratoElegante"],
  },
  {
    id: EQUIPE_VARIANT_SOLO_PORTRAIT,
    label: "Retrato solo",
    intent: "Apresenta um único advogado em destaque institucional.",
  },
] as const;

export const EQUIPE_VARIANT_LABELS = buildVariantLabels(EQUIPE_VARIANT_OPTIONS);

const EQUIPE_VARIANT_LOOKUP = buildVariantLookup(EQUIPE_VARIANT_OPTIONS);

export function normalizeEquipeVariant(
  value: string | undefined,
): EquipeVariant | undefined {
  return normalizeVariantId(value, EQUIPE_VARIANT_LOOKUP);
}

export function getAvailableEquipeVariants(
  lawyerCount: number,
): readonly EquipeVariant[] {
  if (lawyerCount === 1) return [EQUIPE_VARIANT_SOLO_PORTRAIT];
  if (lawyerCount >= 2) {
    return [
      EQUIPE_VARIANT_SPLIT_ALTERNATING,
      EQUIPE_VARIANT_PORTRAIT_GRID,
    ] as const;
  }
  return [];
}

export function getAutoEquipeVariant(
  lawyerCount: number,
): EquipeVariant | undefined {
  if (lawyerCount >= 4) return EQUIPE_VARIANT_PORTRAIT_GRID;
  if (lawyerCount >= 2) return EQUIPE_VARIANT_SPLIT_ALTERNATING;
  return undefined;
}

export function getToggleEquipeVariant(
  lawyerCount: number,
): EquipeVariant | undefined {
  if (lawyerCount === 1) return EQUIPE_VARIANT_SOLO_PORTRAIT;
  return getAutoEquipeVariant(lawyerCount);
}

export function isEquipeVariantAllowed(
  lawyerCount: number,
  variant: EquipeVariant | undefined,
): boolean {
  if (!variant) return lawyerCount >= 2;
  if (variant === EQUIPE_VARIANT_SOLO_PORTRAIT) return lawyerCount === 1;
  return lawyerCount >= 2;
}

export const AREAS_VARIANT_GRID_ICON_CARDS =
  "causi_lp_section_areas_grid_icon_cards" as const;
export const AREAS_VARIANT_QUADRANT_GRID =
  "causi_lp_section_areas_quadrant_grid" as const;

export const AREAS_VARIANTS = [
  AREAS_VARIANT_GRID_ICON_CARDS,
  AREAS_VARIANT_QUADRANT_GRID,
] as const;

export type AreasVariant = (typeof AREAS_VARIANTS)[number];

export const AREAS_VARIANT_OPTIONS: readonly VariantOption<AreasVariant>[] = [
  {
    id: AREAS_VARIANT_GRID_ICON_CARDS,
    label: "Grade",
    intent: "Distribui as áreas em cards com ícone.",
    legacyIds: ["grid"],
  },
  {
    id: AREAS_VARIANT_QUADRANT_GRID,
    label: "Quadrantes",
    intent:
      "Grade dividida por linhas: ícone, título, descrição, sub-itens e link por área.",
    legacyIds: ["lista", "causi_lp_section_areas_list_bands"],
  },
] as const;

export const AREAS_VARIANT_LABELS = buildVariantLabels(AREAS_VARIANT_OPTIONS);

const AREAS_VARIANT_LOOKUP = buildVariantLookup(AREAS_VARIANT_OPTIONS);

export function normalizeAreasVariant(
  value: string | undefined,
): AreasVariant | undefined {
  return normalizeVariantId(value, AREAS_VARIANT_LOOKUP);
}

export const ETAPAS_VARIANT_NUMBERED_STEPS =
  "causi_lp_section_etapas_numbered_steps" as const;
export const ETAPAS_VARIANT_TIMELINE_FLOW =
  "causi_lp_section_etapas_timeline_flow" as const;

export const ETAPAS_VARIANTS = [
  ETAPAS_VARIANT_NUMBERED_STEPS,
  ETAPAS_VARIANT_TIMELINE_FLOW,
] as const;

export type EtapasVariant = (typeof ETAPAS_VARIANTS)[number];

export const ETAPAS_VARIANT_OPTIONS: readonly VariantOption<EtapasVariant>[] = [
  {
    id: ETAPAS_VARIANT_NUMBERED_STEPS,
    label: "Numerado",
    intent: "Resume o fluxo em passos numerados lado a lado.",
    legacyIds: ["numerado"],
  },
  {
    id: ETAPAS_VARIANT_TIMELINE_FLOW,
    label: "Linha do tempo",
    intent: "Conduz a leitura em sequência temporal vertical.",
    legacyIds: ["timeline"],
  },
] as const;

export const ETAPAS_VARIANT_LABELS = buildVariantLabels(ETAPAS_VARIANT_OPTIONS);

const ETAPAS_VARIANT_LOOKUP = buildVariantLookup(ETAPAS_VARIANT_OPTIONS);

export function normalizeEtapasVariant(
  value: string | undefined,
): EtapasVariant | undefined {
  return normalizeVariantId(value, ETAPAS_VARIANT_LOOKUP);
}
