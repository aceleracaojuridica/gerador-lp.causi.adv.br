"use client";

export const HERO_OPTIONS = [
  { id: "centered", label: "Centralizado" },
  { id: "split", label: "Split 50/50" },
  { id: "video", label: "Vídeo + Foto" },
  { id: "stats", label: "Com métricas" },
];
export const DOR_OPTIONS = [
  { id: "comImagem", label: "Com imagem" },
  { id: "soCards", label: "Só cards" },
];
export const SOLUCAO_OPTIONS = [
  { id: "comImagem", label: "Com imagem" },
  { id: "soCards", label: "Só cards" },
  { id: "destaque", label: "Com destaque" },
];
export const SOBRE_OPTIONS = [
  { id: "fotoLista", label: "Foto + lista" },
  { id: "overlay", label: "Imagem + overlay" },
  { id: "duasColunas", label: "Duas colunas" },
];
export const AREAS_OPTIONS = [
  { id: "grid", label: "Grade" },
  { id: "lista", label: "Lista" },
];
export const ETAPAS_OPTIONS = [
  { id: "numerado", label: "Numerado" },
  { id: "timeline", label: "Linha do tempo" },
];
export const EQUIPE_OPTIONS = [
  { id: "splitAlternado", label: "Split alternado" },
  { id: "retratoElegante", label: "Retrato elegante" },
];

export const HERO_VARIANT_LABELS: Record<string, string> = {
  centered: "Centralizado",
  split: "Split 50/50",
  video: "Vídeo + Foto",
  stats: "Com métricas",
};
export const DOR_VARIANT_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
};
export const SOLUCAO_VARIANT_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
  destaque: "Com destaque",
};
export const SOBRE_VARIANT_LABELS: Record<string, string> = {
  fotoLista: "Foto + lista",
  overlay: "Imagem + overlay",
  duasColunas: "Duas colunas",
};
export const AREAS_VARIANT_LABELS: Record<string, string> = {
  grid: "Grade",
  lista: "Lista",
};
export const ETAPAS_VARIANT_LABELS: Record<string, string> = {
  numerado: "Numerado",
  timeline: "Linha do tempo",
};
export const EQUIPE_VARIANT_LABELS: Record<string, string> = {
  splitAlternado: "Split alternado",
  retratoElegante: "Retrato elegante",
};

export type DetailSectionId =
  | "identidade"
  | "imagens"
  | "modelo"
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
  "modelo",
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
  options: Array<{
    id: string;
    label: string;
  }>;
  value: string;
  onChange: (id: string) => void;
};
