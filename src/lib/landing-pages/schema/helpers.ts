import type { Theme } from "./types";

/** Posição de enquadramento de uma foto (background-position), padrão centro. */
export function focalPos(focal?: { x: number; y: number }): string {
  return focal ? `${focal.x}% ${focal.y}%` : "center";
}

function accentInk(hex: string): string {
  const h = hex.replace("#", "");
  const f =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(f, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#ffffff" : "#111a1a";
}

/** Converte um Theme nas variáveis CSS que os componentes consomem. */
export function themeToCssVars(t: Theme): React.CSSProperties {
  return {
    "--lp-brand": t.brand,
    "--lp-brand-dark": t.brandDark,
    "--lp-accent": t.accent,
    "--lp-accent-soft": t.accentSoft,
    "--lp-cream": t.cream,
    "--lp-cream-deep": t.creamDeep,
    "--lp-ink": t.ink,
    "--lp-ink-soft": t.inkSoft,
    "--color-lp-accent-ink": accentInk(t.accent),
  } as React.CSSProperties;
}

/** Monta um link wa.me a partir dos dígitos do WhatsApp. */
export function waLink(whatsapp: string, text?: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}${
    text ? `?text=${encodeURIComponent(text)}` : ""
  }`;
}
