export type SectionImageKey = "hero" | "dor" | "sobre" | "solucao";

export type SectionImages = Record<SectionImageKey, string>;

export const EMPTY_SECTION_IMAGES: SectionImages = {
  hero: "",
  dor: "",
  sobre: "",
  solucao: "",
};

export const SECTION_IMAGE_KEYS: SectionImageKey[] = [
  "hero",
  "dor",
  "sobre",
  "solucao",
];
