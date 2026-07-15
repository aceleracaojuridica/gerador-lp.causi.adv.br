import type { SceneSectionKey } from "./section-images";

export type GalleryImageFilter = "all" | "system" | "account" | "mine";

export const GALLERY_IMAGE_FILTER_OPTIONS: {
  value: GalleryImageFilter;
  label: string;
}[] = [
  { value: "all", label: "Todas" },
  { value: "account", label: "Conta" },
  { value: "mine", label: "Minhas" },
  { value: "system", label: "Sistema" },
];

export const GALLERY_ALL_LPS_VALUE = "__all__";

export type GaleriaFilterValues = {
  origem: GalleryImageFilter;
  lpSlug: string;
};

type FilterableGalleryImage = {
  source: "account" | "system";
  uploadedByUserId: string;
  usages: { slug: string }[];
};

function filterByOrigem<T extends FilterableGalleryImage>(
  images: T[],
  origem: GalleryImageFilter,
  currentUserId?: string,
): T[] {
  switch (origem) {
    case "system":
      return images.filter((img) => img.source === "system");
    case "account":
      return images.filter((img) => img.source === "account");
    case "mine":
      if (!currentUserId) return [];
      return images.filter(
        (img) =>
          img.source === "account" && img.uploadedByUserId === currentUserId,
      );
    default:
      return images;
  }
}

/** Filtra imagens da galeria por origem, uploader ou landing page. */
export function filterGalleryImages<T extends FilterableGalleryImage>(
  images: T[],
  filters: GaleriaFilterValues | GalleryImageFilter,
  currentUserId?: string,
  allLpsValue: string = GALLERY_ALL_LPS_VALUE,
): T[] {
  const values: GaleriaFilterValues =
    typeof filters === "string"
      ? { origem: filters, lpSlug: allLpsValue }
      : filters;

  let result = filterByOrigem(images, values.origem, currentUserId);

  if (values.lpSlug && values.lpSlug !== allLpsValue) {
    result = result.filter((img) =>
      img.usages.some((usage) => usage.slug === values.lpSlug),
    );
  }

  return result;
}

type SemanticCandidate = {
  id: string;
  sectionKey: SceneSectionKey;
  label: string;
  semanticTags: string[];
  sortOrder: number;
  createdAt: string;
};

function normalizeToken(token: string): string {
  return token
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function tokenizeText(input: string): string[] {
  return normalizeToken(input)
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 1);
}

function toKeywordSet(theme: string): Set<string> {
  const out = new Set<string>();
  for (const token of tokenizeText(theme)) out.add(token);
  return out;
}

/** Score semântico local para fallback quando a IA não responder. */
export function scoreSemanticCandidate(
  candidate: SemanticCandidate,
  theme: string,
): number {
  const themeKeywords = toKeywordSet(theme);
  if (themeKeywords.size === 0) {
    return candidate.sortOrder * -0.01;
  }

  const tags = candidate.semanticTags.map(normalizeToken);
  const labelTokens = tokenizeText(candidate.label);
  let score = 0;

  for (const token of tags) {
    if (themeKeywords.has(token)) score += 8;
    if (token.startsWith("adv")) score += 1;
  }

  for (const token of labelTokens) {
    if (themeKeywords.has(token)) score += 4;
  }

  // Preferência leve por itens com sort_order menor para estabilidade editorial.
  score += Math.max(0, 100 - candidate.sortOrder) * 0.01;
  return score;
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Ordena candidatos por score semântico e desempate determinístico por seed.
 * Não usa aleatoriedade global para manter reprodutibilidade.
 */
export function sortCandidatesDeterministically(
  candidates: SemanticCandidate[],
  theme: string,
  seed: string,
): SemanticCandidate[] {
  return [...candidates].sort((a, b) => {
    const scoreA = scoreSemanticCandidate(a, theme);
    const scoreB = scoreSemanticCandidate(b, theme);
    if (scoreB !== scoreA) return scoreB - scoreA;

    const tieA = stableHash(`${seed}:${a.sectionKey}:${a.id}`);
    const tieB = stableHash(`${seed}:${b.sectionKey}:${b.id}`);
    if (tieA !== tieB) return tieA - tieB;

    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}
