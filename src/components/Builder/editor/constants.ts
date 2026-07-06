"use client";

import type { ReactNode } from "react";
import {
  AREAS_THUMBS,
  DOR_THUMBS,
  EQUIPE_THUMBS,
  ETAPAS_THUMBS,
  HERO_THUMBS,
  SOBRE_THUMBS,
  SOLUCAO_THUMBS,
} from "../shared/variant-picker";

export const HERO_OPTIONS = [
  { id: "centered", label: "Centralizado", thumb: HERO_THUMBS.centered },
  { id: "split", label: "Split 50/50", thumb: HERO_THUMBS.split },
  { id: "video", label: "Vídeo + Foto", thumb: HERO_THUMBS.video },
  { id: "stats", label: "Com métricas", thumb: HERO_THUMBS.stats },
];
export const DOR_OPTIONS = [
  { id: "comImagem", label: "Com imagem", thumb: DOR_THUMBS.comImagem },
  { id: "soCards", label: "Só cards", thumb: DOR_THUMBS.soCards },
];
export const SOLUCAO_OPTIONS = [
  { id: "comImagem", label: "Com imagem", thumb: SOLUCAO_THUMBS.comImagem },
  { id: "soCards", label: "Só cards", thumb: SOLUCAO_THUMBS.soCards },
  { id: "destaque", label: "Com destaque", thumb: SOLUCAO_THUMBS.destaque },
];
export const SOBRE_OPTIONS = [
  { id: "fotoLista", label: "Foto + lista", thumb: SOBRE_THUMBS.fotoLista },
  { id: "overlay", label: "Imagem + overlay", thumb: SOBRE_THUMBS.overlay },
  { id: "duasColunas", label: "Duas colunas", thumb: SOBRE_THUMBS.duasColunas },
];
export const AREAS_OPTIONS = [
  { id: "grid", label: "Grade", thumb: AREAS_THUMBS.grid },
  { id: "lista", label: "Lista", thumb: AREAS_THUMBS.lista },
];
export const ETAPAS_OPTIONS = [
  { id: "numerado", label: "Numerado", thumb: ETAPAS_THUMBS.numerado },
  { id: "timeline", label: "Linha do tempo", thumb: ETAPAS_THUMBS.timeline },
];
export const EQUIPE_OPTIONS = [
  {
    id: "splitAlternado",
    label: "Split alternado",
    thumb: EQUIPE_THUMBS.splitAlternado,
  },
  {
    id: "retratoElegante",
    label: "Retrato elegante",
    thumb: EQUIPE_THUMBS.retratoElegante,
  },
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

export function isDetailSectionId(value: string | null): value is DetailSectionId {
  return value !== null && DETAIL_SECTION_IDS.includes(value as DetailSectionId);
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
    thumb?: ReactNode;
  }>;
  value: string;
  onChange: (id: string) => void;
};

const VARIANT_DETAIL_SECTIONS = new Set<DetailSectionId>([
  "hero",
  "dor",
  "solucao",
  "sobre",
  "equipe",
  "areas",
  "etapas",
]);

/** Retorna o controle de variação da seção aberta no painel CMS, se houver. */
export function getVariantControlForDetailSection(
  sectionId: DetailSectionId | null,
  controls: Partial<Record<PreviewEditableSectionId, PreviewVariantControl>>,
): PreviewVariantControl | undefined {
  if (!sectionId || !VARIANT_DETAIL_SECTIONS.has(sectionId)) return undefined;
  return controls[sectionId as PreviewEditableSectionId];
}
