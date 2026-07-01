/*
  Ordem das seções do MEIO da LP (reordenáveis por drag-drop no editor).
  Hero (sempre primeiro), FAQ e Rodapé (sempre no fim) NÃO entram aqui — são fixos.

  Cada item é uma chave de seção built-in ou "custom:<id>" (seção personalizada).
*/
import type { CustomSection, Layout } from "./schema";

/** Seções built-in que podem ser reordenadas. */
export const REORDERABLE_KEYS = [
  "dor",
  "solucao",
  "sobre",
  "equipe",
  "areas",
  "etapas",
  "ctaFinal",
] as const;

/** Rótulo amigável de cada seção built-in (usado na tela de reordenar). */
export const SECTION_LABELS: Record<string, string> = {
  dor: "Dores do cliente",
  solucao: "Como você ajuda",
  sobre: "Sobre o escritório",
  equipe: "Equipe",
  areas: "Áreas de atuação",
  etapas: "Como funciona",
  ctaFinal: "Convite final",
};

/**
 * Ordem efetiva das seções do meio: parte da ordem salva (filtrando itens
 * inválidos) e acrescenta no fim qualquer seção que falte (ex.: seção
 * personalizada recém-criada). Garante todas as reordenáveis exatamente uma vez.
 */
export function effectiveOrder(
  layout: Layout,
  customSections: CustomSection[],
): string[] {
  const customIds = customSections.map((s) => `custom:${s.id}`);
  // Ordem padrão (espelha o layout original): built-ins, customs, e ctaFinal.
  const def = [
    "dor",
    "solucao",
    "sobre",
    "equipe",
    "areas",
    "etapas",
    ...customIds,
    "ctaFinal",
  ];
  const valid = new Set<string>([...REORDERABLE_KEYS, ...customIds]);
  const out: string[] = [];
  for (const i of layout.order ?? []) {
    if (valid.has(i) && !out.includes(i)) out.push(i);
  }
  for (const i of def) {
    if (!out.includes(i)) out.push(i);
  }
  return out;
}

/** Rótulo de um item de ordem (built-in ou custom), dado as seções custom. */
export function labelOf(item: string, customSections: CustomSection[]): string {
  if (item.startsWith("custom:")) {
    const id = item.slice(7);
    const sec = customSections.find((s) => s.id === id);
    return sec?.title?.trim() || "Seção personalizada";
  }
  return SECTION_LABELS[item] ?? item;
}
