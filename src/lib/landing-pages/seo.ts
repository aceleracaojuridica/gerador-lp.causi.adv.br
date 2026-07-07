import { publicLpUrl } from "./lp-url";
import type { LpSchema, Office, SeoMeta } from "./schema";

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 155;
export const SEO_TITLE_IDEAL = 55;
export const SEO_DESC_IDEAL = 150;

type OfficeSeoInput = Pick<
  Office,
  "name" | "area" | "product" | "city" | "logoSrc" | "sectionImages"
>;

export type PublicUrlContext = {
  officeSubdomain: string;
  lpSlug: string;
};

export type ResolvedSeo = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string | undefined;
  favicon: string | undefined;
  keywords: string | undefined;
  indexable: boolean;
  canonicalUrl: string | undefined;
  siteName: string | undefined;
};

/** Gera SEO otimizado para tráfego pago (Google/Meta) a partir dos dados da LP. */
export function buildDefaultSeo(params: {
  office: OfficeSeoInput;
  tema: string;
  heroSub?: string;
}): SeoMeta {
  const { office, tema, heroSub } = params;
  const keyword = (office.product || tema).trim();
  const name = office.name.trim();
  const city = office.city.trim();

  let title = keyword;
  if (city) title = `${keyword} em ${city}`;
  if (name) title = `${title} | ${name}`;
  title = title.slice(0, SEO_TITLE_MAX);

  let description =
    heroSub?.trim() ||
    `Advocacia especializada em ${keyword.toLowerCase()}. Orientação jurídica clara e atendimento próximo. Consulte um especialista.`;
  description = description.slice(0, SEO_DESC_MAX);

  const keywords = [keyword, office.area, city, name]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");

  return {
    title,
    description,
    ogImage: office.sectionImages?.hero || "",
    favicon: office.logoSrc || "",
    siteName: name,
    keywords,
    indexable: false,
    canonicalUrl: "",
    ogTitle: "",
    ogDescription: "",
  };
}

/** Mescla SEO salvo com fallbacks do schema (LPs antigas ou campos vazios). */
export function normalizeSeo(
  seo: Partial<SeoMeta> | undefined,
  schema: Pick<LpSchema, "office" | "hero">,
  tema: string,
  _publicUrl?: PublicUrlContext,
): SeoMeta {
  const defaults = buildDefaultSeo({
    office: schema.office,
    tema,
    heroSub: schema.hero.sub,
  });
  if (!seo) return defaults;

  return {
    title: seo.title?.trim() || defaults.title,
    description: seo.description?.trim() || defaults.description,
    ogImage: seo.ogImage?.trim() || defaults.ogImage,
    favicon: seo.favicon?.trim() || defaults.favicon,
    siteName: seo.siteName?.trim() || defaults.siteName,
    keywords: seo.keywords?.trim() || defaults.keywords,
    indexable: seo.indexable ?? defaults.indexable,
    canonicalUrl: seo.canonicalUrl?.trim() ?? defaults.canonicalUrl,
    ogTitle: seo.ogTitle?.trim() ?? "",
    ogDescription: seo.ogDescription?.trim() ?? "",
  };
}

/** Valores efetivos usados na rota pública e no preview de compartilhamento. */
export function resolveSeo(
  schema: LpSchema,
  publicUrl?: PublicUrlContext,
): ResolvedSeo {
  const tema = schema.office.product || schema.office.area || "";
  const seo = normalizeSeo(schema.seo, schema, tema, publicUrl);

  const title = seo.title;
  const description = seo.description;
  const ogTitle = seo.ogTitle?.trim() || title;
  const ogDescription = seo.ogDescription?.trim() || description;
  const ogImage =
    seo.ogImage?.trim() ||
    schema.office.sectionImages?.hero ||
    schema.office.logoSrc ||
    undefined;
  const favicon = seo.favicon?.trim() || schema.office.logoSrc || undefined;
  const keywords = seo.keywords?.trim() || undefined;
  const indexable = seo.indexable ?? false;
  const siteName = seo.siteName?.trim() || schema.office.name || undefined;
  const canonicalUrl =
    seo.canonicalUrl?.trim() ||
    (publicUrl
      ? publicLpUrl(publicUrl.officeSubdomain, publicUrl.lpSlug)
      : undefined);

  return {
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    favicon,
    keywords,
    indexable,
    canonicalUrl,
    siteName,
  };
}

export function seoCharStatus(
  len: number,
  ideal: number,
  max: number,
): "ok" | "short" | "long" {
  if (len > max) return "long";
  if (len < ideal * 0.85) return "short";
  return "ok";
}
