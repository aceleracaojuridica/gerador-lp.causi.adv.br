import { publicLpHost } from "./lp-url";
import type { LpSchema } from "./schema";
import { resolveSeo } from "./seo";

/** Dados para o card de prévia de link (Open Graph) na galeria de LPs. */
export type LpListPreview = {
  title: string;
  description: string;
  image: string;
  siteName: string;
  host: string;
};

/**
 * Monta a prévia de compartilhamento de uma LP para a listagem.
 * Usa SEO + imagens do schema quando disponíveis.
 */
export function buildLpListPreview(input: {
  schema: LpSchema | null;
  slug: string;
  tema: string;
  name: string;
}): LpListPreview {
  const { schema, slug, tema, name } = input;
  const host = publicLpHost(slug);

  if (!schema?.hero || !schema?.office) {
    return {
      title: tema || name,
      description: tema && name !== tema ? name : "",
      image: "",
      siteName: name,
      host,
    };
  }

  const seo = resolveSeo(schema, slug);

  return {
    title: seo.ogTitle,
    description: seo.ogDescription,
    image: seo.ogImage || "",
    siteName: seo.siteName || name,
    host,
  };
}
