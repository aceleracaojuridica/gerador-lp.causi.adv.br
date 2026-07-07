import {
  AREAS_VARIANT_GRID_ICON_CARDS,
  DOR_VARIANT_WITH_IMAGE_CARDS,
  ETAPAS_VARIANT_NUMBERED_STEPS,
  HERO_VARIANT_CENTERED_FOCUS,
  SOBRE_VARIANT_PHOTO_LIST,
  SOLUCAO_VARIANT_CARDS_COMPACT,
} from "../variants";
import type { Layout, Theme } from "./types";

export const DEFAULT_LAYOUT: Layout = {
  hero: HERO_VARIANT_CENTERED_FOCUS,
  dor: DOR_VARIANT_WITH_IMAGE_CARDS,
  solucao: SOLUCAO_VARIANT_CARDS_COMPACT,
  sobre: SOBRE_VARIANT_PHOTO_LIST,
  areas: AREAS_VARIANT_GRID_ICON_CARDS,
  etapas: ETAPAS_VARIANT_NUMBERED_STEPS,
  tones: {
    hero: "light",
    dor: "light",
    solucao: "dark",
    sobre: "light",
    equipe: "light",
    areas: "dark",
    etapas: "light",
    faq: "light",
    ctaFinal: "dark",
  },
  hidden: { ctaFinal: true },
};

/** Tema default (paleta institucional sóbria) usado antes de extrair da logo. */
export const DEFAULT_THEME: Theme = {
  brand: "#1b2a4a",
  brandDark: "#111a30",
  accent: "#c79a3f",
  accentSoft: "#e6c87c",
  cream: "#faf7f1",
  creamDeep: "#efe6d6",
  ink: "#1b2536",
  inkSoft: "#59647b",
};
