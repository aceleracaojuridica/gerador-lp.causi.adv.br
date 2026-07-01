/** Limite de tentativas ao numerar colisões (base-2, base-3, …). */
export const LP_SLUG_MAX_SUFFIX = 9999;

/**
 * Converte o nome do escritório em slug base (kebab-case, sem acentos).
 * Ex.: "Escritório Silva & Advogados" → "escritorio-silva-advogados"
 */
export function slugFromOfficeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Reserva um slug único globalmente a partir do slug base.
 * Tenta `base`, depois `base-2`, `base-3`, … até encontrar um livre.
 */
export async function allocateUniqueLpSlug(
  slugBase: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string | null> {
  if (!slugBase) return null;

  if (!(await isTaken(slugBase))) return slugBase;

  for (let i = 2; i <= LP_SLUG_MAX_SUFFIX; i++) {
    const candidate = `${slugBase}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  return null;
}
