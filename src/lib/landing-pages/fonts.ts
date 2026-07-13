/*
  Registro das fontes selecionáveis na configuração de Tipografia.
  Cada `cssVar` aponta para a variável definida em app/layout.tsx (next/font).
  O valor "" (vazio) significa "padrão do site" (Fraunces nos títulos, Inter no
  texto) — nenhum override é aplicado.
*/

export type FontOption = { id: string; label: string; cssVar: string };

export const HEADING_FONTS: FontOption[] = [
  { id: "montserrat", label: "Montserrat", cssVar: "var(--font-montserrat)" },
  { id: "cinzel", label: "Cinzel", cssVar: "var(--font-cinzel)" },
  { id: "poppins", label: "Poppins", cssVar: "var(--font-poppins)" },
  { id: "playfair", label: "Playfair Display", cssVar: "var(--font-playfair)" },
  {
    id: "cormorant",
    label: "Cormorant Garamond",
    cssVar: "var(--font-cormorant)",
  },
];

export const BODY_FONTS: FontOption[] = [
  { id: "inter", label: "Inter", cssVar: "var(--font-inter)" },
  { id: "roboto", label: "Roboto", cssVar: "var(--font-roboto)" },
  { id: "poppins", label: "Poppins", cssVar: "var(--font-poppins)" },
  { id: "raleway", label: "Raleway", cssVar: "var(--font-raleway)" },
];

/**
 * Fonte de título padrão nas LPs geradas (aplicada em /api/gerar-lp).
 * O usuário pode trocar depois em Aparência → Tipografia.
 * Os títulos usam peso 600 (`.section-title`), disponível nesta família.
 */
export const DEFAULT_HEADING_FONT_ID = "cormorant";

export function headingFontVar(id?: string): string | undefined {
  return HEADING_FONTS.find((f) => f.id === id)?.cssVar;
}

export function bodyFontVar(id?: string): string | undefined {
  return BODY_FONTS.find((f) => f.id === id)?.cssVar;
}
