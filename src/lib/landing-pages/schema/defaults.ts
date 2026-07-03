import type { Layout, Theme } from "./types";

export const DEFAULT_LAYOUT: Layout = {
  hero: "centered",
  dor: "comImagem",
  solucao: "soCards",
  sobre: "fotoLista",
  areas: "grid",
  etapas: "numerado",
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
