import type { AreaCard } from "./schema";

/**
 * Limites da seção "Áreas de atuação".
 *
 * A GERAÇÃO sempre produz 2 cards com 4 sub-itens cada. Os limites MIN/MAX são
 * do EDITOR: o usuário pode chegar a 4 cards e reduzir sub-itens até 1, mas não
 * pode ficar com menos de 2 cards nem com um card sem nenhum sub-item.
 */
export const AREA_CARDS_GENERATED = 2;
export const AREA_ITEMS_GENERATED = 4;

export const AREA_CARDS_MIN = 2;
export const AREA_CARDS_MAX = 4;
export const AREA_ITEMS_MIN = 1;
export const AREA_ITEMS_MAX = 4;

/**
 * Ajusta o que a IA devolveu ao contrato da seção. O modelo nem sempre respeita
 * a contagem pedida no prompt, e a LP não pode nascer fora do formato.
 */
export function normalizeGeneratedAreaCards(cards: AreaCard[]): AreaCard[] {
  return cards.slice(0, AREA_CARDS_GENERATED).map((card) => ({
    ...card,
    items: (card.items ?? []).slice(0, AREA_ITEMS_GENERATED),
  }));
}
