"use client";

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

export const TOUR: {
  id: string;
  target: string;
  title: string;
  hint: string;
}[] = [
  {
    id: "hero",
    target: "sec-hero",
    title: "Topo da página",
    hint: "Escolha o estilo do topo.",
  },
  {
    id: "dor",
    target: "sec-dor",
    title: "Dores do cliente",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "solucao",
    target: "sec-solucao",
    title: "Como você ajuda",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "sobre",
    target: "sec-sobre",
    title: "Sobre o escritório",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "equipe",
    target: "sec-equipe",
    title: "Equipe",
    hint: "Adicione as fotos e escolha o fundo (claro ou escuro).",
  },
  {
    id: "areas",
    target: "sec-areas",
    title: "Áreas de atuação",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "etapas",
    target: "sec-etapas",
    title: "Como funciona",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "faq",
    target: "sec-faq",
    title: "Perguntas frequentes",
    hint: "Escolha o fundo (claro ou escuro).",
  },
  {
    id: "ctaFinal",
    target: "sec-ctaFinal",
    title: "Convite final",
    hint: "Escolha o fundo (claro ou escuro).",
  },
  {
    id: "footer",
    target: "sec-footer",
    title: "Contato e rodapé",
    hint: "Confira seus contatos e endereço.",
  },
];
