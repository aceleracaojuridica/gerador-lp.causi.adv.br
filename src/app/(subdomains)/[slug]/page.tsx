import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPreview } from "@/components/Preview/landing-preview";
import { getLpPublic } from "@/lib/landing-pages/lp-store";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { resolveSeo } from "@/lib/landing-pages/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lp = await getLpPublic(slug);
  if (!lp) return {};

  const seo = resolveSeo(lp.schema, slug);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    robots: seo.indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: seo.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
    icons: seo.favicon
      ? {
          icon: seo.favicon,
          apple: seo.favicon,
        }
      : undefined,
    openGraph: {
      title: seo.ogTitle,
      description: seo.ogDescription,
      siteName: seo.siteName,
      url: seo.canonicalUrl,
      images: seo.ogImage
        ? [
            {
              url: seo.ogImage,
              width: 1200,
              height: 630,
              alt: seo.ogTitle,
            },
          ]
        : [],
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
  };
}

function buildJsonLd(schema: LpSchema, slug: string) {
  const seo = resolveSeo(schema, slug);
  return {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: schema.office.fullName || schema.office.name,
    description: seo.description,
    ...(schema.office.address || schema.office.city
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: schema.office.city || undefined,
            streetAddress: schema.office.address || undefined,
            addressCountry: "BR",
          },
        }
      : {}),
    ...(schema.office.whatsapp
      ? { telephone: `+${schema.office.whatsapp.replace(/\D/g, "")}` }
      : {}),
    ...(schema.office.email ? { email: schema.office.email } : {}),
    ...(schema.office.city ? { areaServed: schema.office.city } : {}),
    ...(seo.canonicalUrl ? { url: seo.canonicalUrl } : {}),
  };
}

export default async function PublicLpPage({ params }: Props) {
  const { slug } = await params;
  const lp = await getLpPublic(slug);
  if (!lp) notFound();

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD serializado do schema da LP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(buildJsonLd(lp.schema, slug)),
        }}
      />
      <LandingPreview schema={lp.schema} demo={false} />
    </>
  );
}
