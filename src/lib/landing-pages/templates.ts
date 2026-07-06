import { PALETTES } from "./palettes";
import type { Layout, Theme } from "./schema";
import { DEFAULT_LAYOUT } from "./schema";

/** Presets de layout (+ theme para prévias estáticas). Na criação só o `layout` é copiado para o schema; cores vêm da logo. */
export type LpTemplate = {
  id: string;
  name: string;
  description: string;
  theme: Theme;
  layout: Layout;
};

function palette(id: string): Theme {
  const found = PALETTES.find((p) => p.id === id);
  if (!found) throw new Error(`palette not found: ${id}`);
  return found.theme;
}

export const TEMPLATES: LpTemplate[] = [
  {
    id: "classic-light",
    name: "Clássico",
    description: "Sóbrio e profissional. Azul marinho com dourado.",
    theme: palette("azul-marinho"),
    layout: {
      ...DEFAULT_LAYOUT,
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
      hidden: { ctaFinal: false },
    },
  },
  {
    id: "modern-dark",
    name: "Moderno",
    description: "Elegante e marcante. Tons escuros com destaque dourado.",
    theme: palette("simples"),
    layout: {
      ...DEFAULT_LAYOUT,
      hero: "split",
      dor: "soCards",
      solucao: "comImagem",
      sobre: "overlay",
      areas: "lista",
      etapas: "timeline",
      tones: {
        hero: "dark",
        dor: "dark",
        solucao: "light",
        sobre: "dark",
        equipe: "dark",
        areas: "light",
        etapas: "dark",
        faq: "light",
        ctaFinal: "dark",
      },
      hidden: { ctaFinal: false },
    },
  },
  {
    id: "autoridade",
    name: "Autoridade",
    description:
      "Foto do advogado em destaque sobre fundo escuro. Ar premium e de alta autoridade.",
    theme: palette("preto-branco"),
    layout: {
      ...DEFAULT_LAYOUT,
      hero: "recorte",
      dor: "comImagem",
      solucao: "soCards",
      sobre: "overlay",
      areas: "grid",
      etapas: "numerado",
      // Alternância da referência: escuro (hero) → claro (dor) → escuro (áreas) →
      // escuro (sobre, card escuro) → escuro (etapas) → claro (faq) → escuro (rodapé).
      tones: {
        hero: "dark",
        dor: "light",
        solucao: "light",
        sobre: "dark",
        equipe: "dark",
        areas: "dark",
        etapas: "dark",
        faq: "light",
        ctaFinal: "dark",
      },
      // A referência vai do FAQ direto ao rodapé (sem seção de CTA final).
      hidden: { ctaFinal: true },
    },
  },
  {
    id: "warm-neutral",
    name: "Acolhedor",
    description: "Próximo e humano. Tons de caramelo e bege.",
    theme: palette("caramel"),
    layout: {
      ...DEFAULT_LAYOUT,
      hero: "stats",
      dor: "comImagem",
      solucao: "destaque",
      sobre: "duasColunas",
      areas: "grid",
      etapas: "numerado",
      tones: {
        hero: "light",
        dor: "light",
        solucao: "dark",
        sobre: "light",
        equipe: "light",
        areas: "light",
        etapas: "dark",
        faq: "light",
        ctaFinal: "dark",
      },
      hidden: { ctaFinal: false },
    },
  },
];

export const DEFAULT_TEMPLATE_ID = "classic-light";

/** Imagem estática de prévia em `public/templates/{id}.png`. */
export function templatePreviewSrc(id: string): string {
  return `/templates/${id}.png`;
}

export function getTemplate(id?: string): LpTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
