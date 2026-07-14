/*
  Grade de cards das variantes "Com imagem" (Dores e Solução).

  As colunas acompanham a QUANTIDADE de cards, para eles dividirem a largura
  igualmente: 2 cards ocupam 50/50, 3 ocupam 1/3 cada, 4 ocupam 1/4. Com uma
  contagem fixa de colunas (o que havia antes), 2 cards ocupavam 2 de 3 colunas
  e deixavam um buraco à direita.
*/

/** Quantidade de cards aceita nessas variantes. */
export const SECTION_CARDS_MIN = 2;
export const SECTION_CARDS_MAX = 4;

/**
 * Classes de coluna da grade para uma dada quantidade de cards.
 *
 * As classes são literais de propósito: o Tailwind varre o código-fonte em
 * busca dos nomes de classe e não resolveria algo como `grid-cols-${n}`.
 */
export function cardGridCols(count: number): string {
  if (count <= 2) return "md:grid-cols-2";
  if (count === 3) return "md:grid-cols-3";
  return "sm:grid-cols-2 lg:grid-cols-4";
}
