import "server-only";

/*
  Gera um Theme semelhante às cores base (em geral extraídas da logo),
  via OpenAI — usado na etapa de criação da LP (um clique = uma paleta).
*/
import OpenAI from "openai";
import { getOpenAiChatModel, openAiTokenLimit } from "@/lib/env";
import {
  type ExternalApiLogMeta,
  logExternalApiCall,
} from "./lp-external-api-log";
import type { Theme } from "./schema";
import { themeSchema } from "./validation/zod-primitives";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Direções mutuamente distintas — uma é sorteada por clique para evitar micro-variações. */
const VARIATION_AXES = [
  "Escureça MUITO o brand (quase noturno/graphite tingido) e clareie o accent.",
  "Clareie o brand e torne o accent bem mais saturado e vivo (ainda sóbrio, sem neon).",
  "Desloque o accent 15–30° no círculo cromático (vizinho no espectro), mantendo o brand na família da base.",
  "Use accent em contraste quente/frio em relação ao brand (ex.: marca fria + destaque dourado/âmbar, ou o inverso).",
  "Aqueça a paleta inteira (puxe matizes para oliva, bege ou dourado).",
  "Esfrie a paleta inteira (puxe matizes para azul, petróleo ou cinza-azulado).",
  "Versão quase monocromática: baixa saturação, accent só um pouco tingido.",
  "Alto contraste: brand bem escuro + accent bem mais claro e destacado que a base.",
  "Suavize: cream mais quente/bege e brand um pouco mais claro; accent menos gritante.",
  "Aprofunde: brandDark quase preto da mesma família; accent um tom intermediário entre brand e cream.",
] as const;

const SYSTEM = [
  "Você é um designer de identidade visual para escritórios de advocacia brasileiros.",
  "Proponha UMA paleta SEMELHANTE à base (mesma identidade cromática), mas com diferença VISÍVEL a olho nu.",
  "Proibido micro-ajuste: não altere só 1–2 dígitos do hex. A nova paleta deve parecer outra composição quando colocada lado a lado.",
  "Tom sóbrio de advocacia: sem neon, sem saturacão extrema.",
  "Responda SOMENTE com JSON válido no formato pedido. Nada fora do JSON.",
].join("\n");

function normalizeHex(value: string): string | null {
  const v = value.trim();
  if (!HEX.test(v)) return null;
  return v.toLowerCase();
}

function parseTheme(raw: unknown): Theme | null {
  const parsed = themeSchema.safeParse(raw);
  if (!parsed.success) return null;
  const out: Theme = {
    brand: "",
    brandDark: "",
    accent: "",
    accentSoft: "",
    cream: "",
    creamDeep: "",
    ink: "",
    inkSoft: "",
  };
  for (const key of Object.keys(out) as (keyof Theme)[]) {
    const hex = normalizeHex(parsed.data[key]);
    if (!hex) return null;
    out[key] = hex;
  }
  return out;
}

/** Aceita `{ theme: {...} }` ou o Theme flat na raiz. */
function extractThemeFromPayload(parsed: unknown): Theme | null {
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  if ("theme" in obj) return parseTheme(obj.theme);
  return parseTheme(obj);
}

function pickVariationAxis(exclude?: string): string {
  const pool = exclude
    ? VARIATION_AXES.filter((a) => a !== exclude)
    : [...VARIATION_AXES];
  const list = pool.length > 0 ? pool : [...VARIATION_AXES];
  return list[Math.floor(Math.random() * list.length)];
}

/** Diferença perceptível mínima entre dois hex #RRGGBB (soma |ΔR|+|ΔG|+|ΔB|). */
function hexDistance(a: string, b: string): number {
  const parse = (h: string) =>
    [
      Number.parseInt(h.slice(1, 3), 16),
      Number.parseInt(h.slice(3, 5), 16),
      Number.parseInt(h.slice(5, 7), 16),
    ] as const;
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
}

/** Exige mudança perceptível em brand ou accent vs avoid/base. */
function isVisiblyDifferent(theme: Theme, reference: Theme): boolean {
  const brandDist = hexDistance(theme.brand, reference.brand);
  const accentDist = hexDistance(theme.accent, reference.accent);
  // ~60+ em canal somado ≈ mudança óbvia (evita #2e616b → #2b585f)
  return brandDist >= 60 || accentDist >= 80;
}

async function requestSimilarPalette(
  client: OpenAI,
  base: Theme,
  avoid: Theme | undefined,
  axis: string,
  log?: ExternalApiLogMeta,
): Promise<Theme | null> {
  const model = getOpenAiChatModel();
  const messages = [
    { role: "system" as const, content: SYSTEM },
    {
      role: "user" as const,
      content: [
        "Paleta base (hex #RRGGBB) — use como âncora da família cromática:",
        JSON.stringify(base, null, 2),
        "",
        `DIREÇÃO OBRIGATÓRIA deste sorteio: ${axis}`,
        "",
        avoid
          ? [
              "NÃO repita nem aproxime desta paleta atual:",
              JSON.stringify(avoid, null, 2),
              "brand e accent devem diferir DE VERDADE (não 2–3 pontos de luminosidade).",
            ].join("\n")
          : "",
        "",
        "Gere EXATAMENTE 1 Theme completo.",
        "Regras estruturais:",
        "- brand e brandDark: fundos escuros ok para texto claro.",
        "- accent: CTA/destaque; accentSoft: versão mais clara do accent.",
        "- cream/creamDeep: fundos claros; ink/inkSoft: textos escuros.",
        "- Mantenha coerência de advocacia sóbria.",
        "",
        'Responda com: { "theme": { "brand": "#......", "brandDark": "#......", "accent": "#......", "accentSoft": "#......", "cream": "#......", "creamDeep": "#......", "ink": "#......", "inkSoft": "#......" } }',
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
  const requestPayload = {
    model,
    ...openAiTokenLimit(model, 800),
    response_format: { type: "json_object" as const },
    messages,
  };
  const started = Date.now();

  try {
    const completion = await client.chat.completions.create(requestPayload);
    const choice = completion.choices[0];
    const raw = choice?.message?.content ?? "";

    // Resposta vazia/não-JSON: null para o caller tentar outro eixo (não abortar).
    if (!raw.trim()) {
      if (log) {
        void logExternalApiCall({
          ...log,
          provider: "openai",
          operation: "chat.completions",
          requestPayload,
          responsePayload: {
            finish_reason: choice?.finish_reason ?? null,
            refusal: choice?.message?.refusal ?? null,
          },
          durationMs: Date.now() - started,
          ok: false,
          error: "empty_response",
        });
      }
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      if (log) {
        void logExternalApiCall({
          ...log,
          provider: "openai",
          operation: "chat.completions",
          requestPayload,
          responsePayload: {
            raw,
            finish_reason: choice?.finish_reason ?? null,
          },
          durationMs: Date.now() - started,
          ok: false,
          error: "invalid_json",
        });
      }
      return null;
    }

    const theme = extractThemeFromPayload(parsed);
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "openai",
        operation: "chat.completions",
        requestPayload,
        responsePayload: { theme, raw },
        durationMs: Date.now() - started,
        ok: Boolean(theme),
        error: theme ? null : "invalid_theme",
      });
    }
    return theme;
  } catch (err) {
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "openai",
        operation: "chat.completions",
        requestPayload,
        durationMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    // Rede/API: também null — permite 2ª tentativa com outro eixo.
    return null;
  }
}

function acceptsTheme(
  theme: Theme,
  base: Theme,
  avoid: Theme | undefined,
): boolean {
  const vsBase = isVisiblyDifferent(theme, base);
  const vsAvoid = avoid ? isVisiblyDifferent(theme, avoid) : true;
  // Precisa mudar da base E, se houver avoid, também do avoid.
  return vsBase && vsAvoid;
}

/**
 * Chama a OpenAI e devolve 1 Theme semelhante à paleta base, distinto de `avoid`.
 * Sorteia um eixo de variação; se a diferença for só micro-ajuste ou a resposta
 * vier vazia/inválida, tenta 1 vez mais. Devolve null se ambas falharem.
 */
export async function callOpenAiForSimilarPalette(
  apiKey: string,
  base: Theme,
  avoid?: Theme,
  log?: ExternalApiLogMeta,
): Promise<Theme | null> {
  const client = new OpenAI({ apiKey });
  const firstAxis = pickVariationAxis();
  const first = await requestSimilarPalette(
    client,
    base,
    avoid,
    firstAxis,
    log,
  );
  if (first && acceptsTheme(first, base, avoid)) return first;

  const secondAxis = pickVariationAxis(firstAxis);
  const second = await requestSimilarPalette(
    client,
    base,
    avoid,
    secondAxis,
    log,
  );
  if (second && acceptsTheme(second, base, avoid)) return second;

  // Melhor um resultado fraco do que falha total no 2º clique.
  return second ?? first;
}
