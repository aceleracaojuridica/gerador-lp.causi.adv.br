"use client";

export {
  AREAS_VARIANT_LABELS,
  AREAS_VARIANT_OPTIONS as AREAS_OPTIONS,
  DOR_VARIANT_LABELS,
  DOR_VARIANT_OPTIONS as DOR_OPTIONS,
  EQUIPE_VARIANT_LABELS,
  EQUIPE_VARIANT_OPTIONS as EQUIPE_OPTIONS,
  ETAPAS_VARIANT_LABELS,
  ETAPAS_VARIANT_OPTIONS as ETAPAS_OPTIONS,
  HERO_VARIANT_LABELS,
  HERO_VARIANT_OPTIONS as HERO_OPTIONS,
  SOBRE_VARIANT_LABELS,
  SOBRE_VARIANT_OPTIONS as SOBRE_OPTIONS,
  SOLUCAO_VARIANT_LABELS,
  SOLUCAO_VARIANT_OPTIONS as SOLUCAO_OPTIONS,
} from "@/lib/landing-pages/variants";

export type DetailSectionId =
  | "identidade"
  | "imagens"
  | "aparencia"
  | "integracoes"
  | "seo"
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "equipe"
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "footer";

export const DETAIL_SECTION_IDS: DetailSectionId[] = [
  "identidade",
  "imagens",
  "aparencia",
  "integracoes",
  "seo",
  "hero",
  "dor",
  "solucao",
  "sobre",
  "equipe",
  "areas",
  "etapas",
  "faq",
  "ctaFinal",
  "footer",
];

export function isDetailSectionId(
  value: string | null,
): value is DetailSectionId {
  return (
    value !== null && DETAIL_SECTION_IDS.includes(value as DetailSectionId)
  );
}

export type PreviewEditableSectionId =
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "equipe"
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "footer";

export type PreviewVariantControl = {
  label: string;
  options: ReadonlyArray<{
    id: string;
    label: string;
  }>;
  value: string;
  onChange: (id: string) => void;
};
