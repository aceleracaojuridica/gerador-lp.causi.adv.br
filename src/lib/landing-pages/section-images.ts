/**
 * Cenas de fundo — resolvidas automaticamente na criação da LP (catálogo do
 * sistema, Unsplash ou pool local), uma por seção.
 */
export type SceneSectionKey = "hero" | "dor" | "sobre" | "solucao";

export type SceneImages = Record<SceneSectionKey, string>;

export const SCENE_SECTION_KEYS: SceneSectionKey[] = [
  "hero",
  "dor",
  "sobre",
  "solucao",
];

export const EMPTY_SCENE_IMAGES: SceneImages = {
  hero: "",
  dor: "",
  sobre: "",
  solucao: "",
};

/**
 * Chaves armazenadas em `office.sectionImages`.
 *
 * `heroDestaque` não é uma cena: é a figura recortada à direita do topo, usada
 * quando o hero não pode exibir o retrato de um advogado — com 2+ advogados a
 * seção Equipe existe, e destacar um só no topo seria favoritismo.
 */
export type SectionImageKey = SceneSectionKey | "heroDestaque";

export type SectionImages = Record<SectionImageKey, string>;

export const EMPTY_SECTION_IMAGES: SectionImages = {
  hero: "",
  heroDestaque: "",
  dor: "",
  sobre: "",
  solucao: "",
};

export const SECTION_IMAGE_KEYS: SectionImageKey[] = [
  "hero",
  "heroDestaque",
  "dor",
  "sobre",
  "solucao",
];
