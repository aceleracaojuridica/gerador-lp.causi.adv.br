/*
  Utilidades de cor para o builder.

  - hexToRgbString: usado nos gradientes inline das seções (rgba(${rgb}, a)).
  - extractPalette: extrai uma paleta a partir da logo (canvas, no navegador) e
    mapeia para os tokens do tema. GARANTE contraste: se a logo é monocromática,
    o accent vira uma cor contrastante (dourado) para os destaques ficarem legíveis.
  - detectLogoBackground: descobre o fundo da logo (transparente/claro/escuro)
    para casar o fundo da hero (ver build-spec "Padrão 9 — logo do cliente").
*/
import type { Theme } from "./schema";
import { DEFAULT_THEME } from "./schema";

export function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/** Overlay vertical sobre foto de fundo do Hero centralizado. */
export function heroImageOverlay(
  dark: boolean,
  brandDarkRgb: string,
  creamRgb: string,
  creamDeepRgb: string,
): string {
  return dark
    ? `linear-gradient(180deg, rgba(${brandDarkRgb},0.78), rgba(${brandDarkRgb},0.9))`
    : `linear-gradient(180deg, rgba(${creamRgb},0.86), rgba(${creamDeepRgb},0.92))`;
}

/** Overlay diagonal sobre foto de fundo do Hero stats. */
export function heroStatsImageOverlay(
  dark: boolean,
  brandRgb: string,
  creamRgb: string,
  creamDeepRgb: string,
): string {
  return dark
    ? `linear-gradient(120deg, rgba(${brandRgb},0.92), rgba(${brandRgb},0.72))`
    : `linear-gradient(120deg, rgba(${creamRgb},0.90), rgba(${creamDeepRgb},0.85))`;
}

/** Overlay sobre imagem de card (Dor / Solução comImagem). */
export function cardImageOverlay(
  brandRgb: string,
  brandDarkRgb: string,
  variant: "dor" | "solucao" = "dor",
): string {
  const [a, b] = variant === "solucao" ? [0.2, 0.4] : [0.25, 0.45];
  return `linear-gradient(160deg, rgba(${brandRgb},${a}), rgba(${brandDarkRgb},${b}))`;
}

/** Overlay leve sobre thumbnail de vídeo no Hero. */
export function thumbImageOverlay(brandDarkRgb: string): string {
  return `linear-gradient(rgba(${brandDarkRgb},0.25), rgba(${brandDarkRgb},0.35))`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

type Hsl = { h: number; s: number; l: number };

function rgbToHsl(r: number, g: number, b: number): Hsl {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function clampHsl(h: Hsl): Hsl {
  return {
    h: ((h.h % 360) + 360) % 360,
    s: Math.max(0, Math.min(1, h.s)),
    l: Math.max(0, Math.min(1, h.l)),
  };
}

/** Distância angular entre dois matizes (0-180). */
function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

type Sample = { r: number; g: number; b: number; count: number; hsl: Hsl };

function sampleCanvas(img: HTMLImageElement, size = 72) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  return { ctx, size, data: ctx.getImageData(0, 0, size, size).data };
}

/**
 * Extrai cores dominantes da logo e devolve um Theme COM contraste garantido.
 * Roda apenas no navegador. Em falha, devolve DEFAULT_THEME.
 */
export function extractPalette(img: HTMLImageElement): Theme {
  try {
    const sampled = sampleCanvas(img, 64);
    if (!sampled) return DEFAULT_THEME;
    const { data } = sampled;

    const buckets = new Map<string, Sample>();
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2],
        a = data[i + 3];
      if (a < 128) continue; // transparente
      const hsl = rgbToHsl(r, g, b);
      if (hsl.l > 0.94 || hsl.l < 0.06) continue; // descarta quase-branco/preto
      const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
      const ex = buckets.get(key);
      if (ex) {
        ex.r += r;
        ex.g += g;
        ex.b += b;
        ex.count++;
      } else {
        buckets.set(key, { r, g, b, count: 1, hsl });
      }
    }

    const list = [...buckets.values()].map((bk) => {
      const r = bk.r / bk.count,
        g = bk.g / bk.count,
        b = bk.b / bk.count;
      return { r, g, b, count: bk.count, hsl: rgbToHsl(r, g, b) };
    });
    if (list.length === 0) return DEFAULT_THEME;

    // PRIMÁRIA: a cor real da logo — mais vívida e presente (frequência ×
    // saturação). É ela que deve dominar a marca; nada de inventar cor.
    const colored = list.filter((c) => c.hsl.s > 0.12);
    const base = (colored.length ? colored : list).sort(
      (a, b) => b.count * (0.35 + b.hsl.s) - a.count * (0.35 + a.hsl.s),
    )[0];
    const baseHsl = base.hsl;

    // brand: a PRÓPRIA cor da logo, só com profundidade suficiente para servir
    // de fundo com texto claro. Mantém o matiz; não escurece a ponto de virar
    // outra cor (antes esmagava roxo em quase-preto).
    const brandHsl = clampHsl({
      h: baseHsl.h,
      s: Math.min(0.92, Math.max(baseHsl.s, 0.4)),
      l: Math.min(0.44, Math.max(0.3, baseHsl.l)),
    });

    // accent: se a logo tem uma SEGUNDA cor distinta de verdade, usa ela.
    // Senão, é uma variação MAIS CLARA da própria cor da marca (mesma família),
    // nunca uma cor inventada (dourado etc.).
    const second = [...list]
      .filter((c) => c.hsl.s > 0.3 && hueDist(c.hsl.h, brandHsl.h) > 40)
      .sort((a, b) => b.hsl.s * b.count - a.hsl.s * a.count)[0];
    const accentHsl = second
      ? clampHsl({
          h: second.hsl.h,
          s: Math.max(second.hsl.s, 0.5),
          l: Math.max(0.46, Math.min(second.hsl.l, 0.6)),
        })
      : clampHsl({
          h: baseHsl.h,
          s: Math.min(0.9, Math.max(baseHsl.s, 0.55)),
          l: 0.56,
        });

    const brand = hslToHex(brandHsl);
    const brandDark = hslToHex(
      clampHsl({ ...brandHsl, l: Math.max(0.12, brandHsl.l - 0.1) }),
    );
    const accent = hslToHex(accentHsl);
    const accentSoft = hslToHex(
      clampHsl({
        ...accentHsl,
        s: Math.min(accentHsl.s, 0.78),
        l: Math.min(0.78, accentHsl.l + 0.18),
      }),
    );
    // cream/creamDeep: quase-branco levemente tingido pelo MATIZ da marca
    // (fica na mesma família da logo, sem cor estranha).
    const cream = hslToHex(clampHsl({ h: brandHsl.h, s: 0.16, l: 0.965 }));
    const creamDeep = hslToHex(clampHsl({ h: brandHsl.h, s: 0.2, l: 0.91 }));
    const ink = hslToHex(clampHsl({ ...brandHsl, l: 0.16 }));
    const inkSoft = hslToHex(clampHsl({ h: brandHsl.h, s: 0.14, l: 0.43 }));

    return {
      brand,
      brandDark,
      accent,
      accentSoft,
      cream,
      creamDeep,
      ink,
      inkSoft,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export type LogoBg = {
  // "light" → fundo claro (texto escuro). "dark" → fundo escuro (texto claro).
  type: "transparent" | "light" | "dark";
  color: string; // hex do fundo (vazio se transparente)
};

export const DEFAULT_LOGO_BG: LogoBg = { type: "transparent", color: "" };

/**
 * Detecta o fundo da logo amostrando os pixels da borda: predomina transparência?
 * é claro (~branco)? é escuro/colorido? Usado para casar o fundo da hero.
 */
export function detectLogoBackground(img: HTMLImageElement): LogoBg {
  try {
    const sampled = sampleCanvas(img, 80);
    if (!sampled) return DEFAULT_LOGO_BG;
    const { data, size } = sampled;

    const idx = (x: number, y: number) => (y * size + x) * 4;
    const border: number[] = [];
    for (let x = 0; x < size; x++) {
      border.push(idx(x, 0), idx(x, size - 1));
    }
    for (let y = 0; y < size; y++) {
      border.push(idx(0, y), idx(size - 1, y));
    }

    let transparent = 0,
      opaque = 0,
      r = 0,
      g = 0,
      b = 0;
    for (const p of border) {
      if (data[p + 3] < 128) {
        transparent++;
      } else {
        opaque++;
        r += data[p];
        g += data[p + 1];
        b += data[p + 2];
      }
    }

    if (transparent / border.length > 0.55) return DEFAULT_LOGO_BG;
    if (opaque === 0) return DEFAULT_LOGO_BG;

    r /= opaque;
    g /= opaque;
    b /= opaque;
    const { l } = rgbToHsl(r, g, b);
    const color = rgbToHex(r, g, b);
    return { type: l >= 0.5 ? "light" : "dark", color };
  } catch {
    return DEFAULT_LOGO_BG;
  }
}
