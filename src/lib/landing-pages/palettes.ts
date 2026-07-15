/*
  Paletas pré-prontas (sóbrias, p/ advocacia). Cada uma é um Theme completo,
  autorado seguindo a estrutura de luminosidade:
  - brand/brandDark: cor profunda (fundo escuro + texto branco)
  - accent/accentSoft: par de destaque (CTA, trecho da manchete)
  - cream/creamDeep: quase-branco (fundo claro / fundo dos cards)
  - ink/inkSoft: textos

  Usadas pelo PalettePicker como alternativa confiável à extração da logo.

  Obs.: o Theme tem UM par de destaque (accent). Em paletas com azul E dourado,
  uso o azul como cor da marca e o dourado como accent (assim os dois aparecem).
*/
import type { Theme } from "./schema";

export type Palette = { id: string; name: string; theme: Theme };

export const PALETTES: Palette[] = [
  {
    id: "azul-marinho",
    name: "Azul Marinho",
    theme: {
      brand: "#192f45",
      brandDark: "#0d1b29",
      accent: "#d0b173",
      accentSoft: "#e6d3ab",
      cream: "#f9f6ef",
      creamDeep: "#f3eee2",
      ink: "#0d1b29",
      inkSoft: "#4d5a6b",
    },
  },
  {
    // Texto/fundo escuro = preto azulado; o azul é só destaque (ícones,
    // trecho da manchete, CTA). Rodapé usa o brandDark (mais escuro).
    id: "azul",
    name: "Azul",
    theme: {
      brand: "#040a1c",
      brandDark: "#02050e",
      accent: "#2169e7",
      accentSoft: "#86abf2",
      cream: "#fbfaf6",
      creamDeep: "#eef1f6",
      ink: "#040a1c",
      inkSoft: "#46566e",
    },
  },
  {
    id: "verde",
    name: "Verde",
    theme: {
      brand: "#0c4139",
      brandDark: "#082b25",
      accent: "#caaa60",
      accentSoft: "#e3cf9a",
      cream: "#fcfaf3",
      creamDeep: "#f0ead9",
      ink: "#0c211c",
      inkSoft: "#4a5b54",
    },
  },
  {
    id: "agro",
    name: "Agro",
    theme: {
      brand: "#1a6539",
      brandDark: "#122117", // "verde forte" do rodapé
      accent: "#dbc08a",
      accentSoft: "#ecdcbc",
      cream: "#fcfaf8",
      creamDeep: "#ece4d6",
      ink: "#122117",
      inkSoft: "#4a5a50",
    },
  },
  {
    id: "teal",
    name: "Petróleo",
    theme: {
      brand: "#0f4c5c",
      brandDark: "#08323d",
      accent: "#2a9d8f",
      accentSoft: "#8fd4cb",
      cream: "#f3faf9",
      creamDeep: "#ddeeec",
      ink: "#0e2a30",
      inkSoft: "#4a6065",
    },
  },
  {
    id: "burgundy",
    name: "Bordô",
    theme: {
      brand: "#6d1a36",
      brandDark: "#4a0f24",
      accent: "#b03052",
      accentSoft: "#e8a3b4",
      cream: "#fbf6f7",
      creamDeep: "#f1e3e7",
      ink: "#2a141a",
      inkSoft: "#6b5158",
    },
  },
  {
    id: "caramel",
    name: "Caramelo",
    theme: {
      brand: "#6b4423",
      brandDark: "#43290f",
      accent: "#c8893f",
      accentSoft: "#e8c39a",
      cream: "#faf6f0",
      creamDeep: "#efe3d4",
      ink: "#2a1d10",
      inkSoft: "#6b5847",
    },
  },
  {
    id: "simples",
    name: "Simples",
    theme: {
      // As 4 amostras do seletor são brand/accent/accentSoft/cream — mapeei
      // aqui as 4 cores informadas. brandDark/creamDeep/ink/inkSoft são os pares
      // (mais escuro / card / textos) derivados para o tema funcionar.
      brand: "#111318",
      brandDark: "#08090c",
      accent: "#1b6e6e",
      accentSoft: "#8a8f98",
      cream: "#ffffff",
      creamDeep: "#f2f3f5",
      ink: "#111318",
      inkSoft: "#8a8f98",
    },
  },
  {
    id: "laranja-dourado",
    name: "Laranja & Dourado",
    theme: {
      brand: "#1b2a4a",
      brandDark: "#111a30",
      accent: "#e07a1f", // laranja (o hex não veio no briefing; ajustável)
      accentSoft: "#f2b277",
      cream: "#ffffff",
      creamDeep: "#faf7f1",
      ink: "#1b2536",
      inkSoft: "#59647b",
    },
  },
  {
    // Monocromática (preto & branco). Fundo escuro cinza-grafite; destaque em
    // cinza-claro; fundo claro branco. Sem cor de acento — visual sóbrio.
    id: "preto-branco",
    name: "Preto & Branco",
    theme: {
      brand: "#222222",
      brandDark: "#1a1a1a",
      // Destaque: grafite (#222) em fundo claro, prata (#C0BEBE) em fundo escuro.
      accent: "#222222",
      accentSoft: "#c0bebe",
      cream: "#ffffff",
      creamDeep: "#f2f1f1",
      ink: "#222222",
      inkSoft: "#6e6e6e",
    },
  },
];

/** Id da paleta que casa com o theme atual (por brand+accent), ou null. */
export function matchPalette(theme: Theme): string | null {
  return (
    PALETTES.find(
      (p) => p.theme.brand === theme.brand && p.theme.accent === theme.accent,
    )?.id ?? null
  );
}
