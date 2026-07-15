/*
  Registro das fontes selecionáveis na configuração de Tipografia.
  Cada `cssVar` aponta para a variável CSS da família.
  No editor, as vars vêm de next/font no layout `(app)`.
  Na LP pública, Inter + Fraunces vêm de next/font; demais famílias
  entram via stylesheet Google Fonts (display=swap).
  O valor "" (vazio) significa "padrão do site" (Fraunces / Inter).
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

/** Famílias já carregadas via next/font na rota pública (não precisam de Google). */
const PUBLIC_BUILTIN_FONT_IDS = new Set(["inter"]);

/** Query Google Fonts css2 por id do catálogo. */
const GOOGLE_FONT_FAMILY: Record<string, string> = {
  montserrat: "Montserrat:wght@500;600;700",
  cinzel: "Cinzel:wght@400;500;600;700",
  poppins: "Poppins:wght@400;500;600;700",
  playfair: "Playfair+Display:wght@400;500;600;700",
  cormorant: "Cormorant+Garamond:wght@400;500;600;700",
  roboto: "Roboto:wght@400;500;700",
  raleway: "Raleway:wght@400;500;600;700",
};

/** Nome CSS da família (para mapear --font-* na LP pública). */
const GOOGLE_FONT_CSS_NAME: Record<string, string> = {
  montserrat: "'Montserrat', sans-serif",
  cinzel: "'Cinzel', serif",
  poppins: "'Poppins', sans-serif",
  playfair: "'Playfair Display', serif",
  cormorant: "'Cormorant Garamond', serif",
  roboto: "'Roboto', sans-serif",
  raleway: "'Raleway', sans-serif",
};

export function headingFontVar(id?: string): string | undefined {
  return HEADING_FONTS.find((f) => f.id === id)?.cssVar;
}

export function bodyFontVar(id?: string): string | undefined {
  return BODY_FONTS.find((f) => f.id === id)?.cssVar;
}

/**
 * Stylesheet Google Fonts + overrides de CSS vars para fontes escolhidas
 * que não vêm de next/font na rota pública.
 */
export function resolvePublicExtraFonts(fonts?: {
  heading?: string;
  body?: string;
}): { stylesheetHref: string | null; cssVarOverrides: string } {
  const ids = [fonts?.heading, fonts?.body]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id))
    .filter((id) => !PUBLIC_BUILTIN_FONT_IDS.has(id));

  const unique = [...new Set(ids)].filter((id) => GOOGLE_FONT_FAMILY[id]);
  if (unique.length === 0) {
    return { stylesheetHref: null, cssVarOverrides: "" };
  }

  const families = unique
    .map((id) => `family=${GOOGLE_FONT_FAMILY[id]}`)
    .join("&");
  const stylesheetHref = `https://fonts.googleapis.com/css2?${families}&display=swap`;

  const cssVarOverrides = unique
    .map((id) => {
      const value = GOOGLE_FONT_CSS_NAME[id];
      return value ? `--font-${id}: ${value};` : "";
    })
    .filter(Boolean)
    .join("\n");

  return { stylesheetHref, cssVarOverrides };
}
