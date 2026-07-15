import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPageTracking } from "@/components/landing-page-tracking";
import { LandingPreview } from "@/components/Preview/landing-preview";
import { applyGlobalConfigToOffice } from "@/lib/landing-pages/global-config";
import { getLpPublic } from "@/lib/landing-pages/lp-store";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { resolveSeo } from "@/lib/landing-pages/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ escritorio: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { escritorio, slug } = await params;
  const lp = await getLpPublic(escritorio, slug);
  if (!lp) return {};

  const seo = resolveSeo(lp.schema, {
    officeSubdomain: lp.officeSubdomain,
    lpSlug: lp.slug,
  });

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

function buildJsonLd(
  schema: LpSchema,
  publicUrl: { officeSubdomain: string; lpSlug: string },
) {
  const seo = resolveSeo(schema, publicUrl);
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
  const { escritorio, slug } = await params;
  const lp = await getLpPublic(escritorio, slug);
  if (!lp) notFound();

  const office = applyGlobalConfigToOffice(
    lp.schema.office,
    lp.accountMarketingConfig,
    { overwrite: false, marketingOnly: true },
  );
  const schema: LpSchema = { ...lp.schema, office };

  const publicUrl = {
    officeSubdomain: lp.officeSubdomain,
    lpSlug: lp.slug,
  };
  const seo = resolveSeo(schema, publicUrl);
  const jsonLd =
    seo.indexable && JSON.stringify(buildJsonLd(schema, publicUrl));

  return (
    <>
      {jsonLd ? (
        <script type="application/ld+json" suppressHydrationWarning>
          {jsonLd}
        </script>
      ) : null}
      <LandingPageTracking office={office} />
      <LandingPreview
        schema={schema}
        demo={false}
        leadContext={{
          officeSubdomain: lp.officeSubdomain,
          lpSlug: lp.slug,
        }}
      />
    </>
  );
}
