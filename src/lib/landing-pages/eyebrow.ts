import type { FocoCopy } from "./focos";

/**
 * O eyebrow é o rótulo curto acima do título da seção ("Sobre o escritório",
 * "Áreas de atuação"). Ele é renderizado em caixa alta, com letter-spacing largo
 * e um traço decorativo — então uma frase longa quebra em várias linhas e polui,
 * principalmente no mobile.
 */
export const EYEBROW_MAX_WORDS = 4;
export const EYEBROW_MAX_CHARS = 32;

/**
 * Palavras que não podem TERMINAR um rótulo. Sem isso, cortar
 * "Direito Previdenciário e Aposentadoria" no limite deixaria
 * "Direito Previdenciário e" — pendurado numa conjunção.
 */
const CONECTIVOS_FINAIS = new Set([
  "e",
  "ou",
  "de",
  "do",
  "da",
  "dos",
  "das",
  "em",
  "no",
  "na",
  "com",
  "para",
  "por",
  "o",
  "a",
  "os",
  "as",
  "que",
]);

/**
 * Encurta um eyebrow longo SEM cortar palavra pela metade: descarta as palavras
 * excedentes em vez de truncar caracteres, e nunca termina em conectivo.
 *
 * Isto é uma REDE DE SEGURANÇA, não a solução: se a IA devolver uma frase em vez
 * de um rótulo, nenhum corte produz um bom rótulo — quem resolve isso é a regra
 * do prompt. Aqui só garantimos que o layout não quebre no mobile.
 */
export function shortenEyebrow(value: string): string {
  const clean = value.trim().replace(/\s+/g, " ");
  if (!clean) return "";

  const words = clean.split(" ").slice(0, EYEBROW_MAX_WORDS);

  while (words.length > 1 && words.join(" ").length > EYEBROW_MAX_CHARS) {
    words.pop();
  }

  while (
    words.length > 1 &&
    CONECTIVOS_FINAIS.has(words[words.length - 1].toLowerCase())
  ) {
    words.pop();
  }

  return words.join(" ");
}

/** Aplica o limite a todos os eyebrows da copy gerada pela IA. */
export function normalizeGeneratedEyebrows(copy: FocoCopy): void {
  const sections = [
    copy.hero,
    copy.dor,
    copy.solucao,
    copy.areas,
    copy.etapas,
    copy.faq,
  ];

  for (const section of sections) {
    if (section && typeof section.eyebrow === "string") {
      section.eyebrow = shortenEyebrow(section.eyebrow);
    }
  }
}
