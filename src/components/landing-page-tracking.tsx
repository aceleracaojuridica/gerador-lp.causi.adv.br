import Script from "next/script";
import { Fragment } from "react";
import type { Office } from "@/lib/landing-pages/schema";
import { normalizeTracking } from "@/lib/landing-pages/tracking";

const COMPLETE_SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;

type ParsedSnippetScript = {
  key: string;
  src?: string;
  inline?: string;
};

/** Extrai blocos `<script>...</script>` válidos para renderização via next/script. */
function extractCompleteScripts(
  html: string,
  snippetId: string,
): ParsedSnippetScript[] {
  const scripts: ParsedSnippetScript[] = [];
  let index = 0;

  for (const match of html.matchAll(COMPLETE_SCRIPT_RE)) {
    const attrs = match[1] ?? "";
    const content = match[2] ?? "";
    const srcMatch = /\bsrc=["']([^"']+)["']/i.exec(attrs);
    const key = `${snippetId}-script-${index++}`;

    if (srcMatch?.[1]) {
      scripts.push({ key, src: srcMatch[1] });
      continue;
    }

    if (content.trim()) {
      scripts.push({ key, inline: content });
    }
  }

  return scripts;
}

/** Remove scripts (incluindo markup malformado) antes de injetar HTML livre. */
function stripScriptMarkup(html: string): string {
  return html.replace(/<script\b[\s\S]*?(<\/script\s*>|$)/gi, "").trim();
}

function renderSnippet(id: string, html: string | undefined) {
  if (!html?.trim()) return null;

  const scripts = extractCompleteScripts(html, id);
  const safeHtml = stripScriptMarkup(html);
  if (!safeHtml && scripts.length === 0) return null;

  return (
    <Fragment key={id}>
      {safeHtml ? (
        <div
          suppressHydrationWarning
          // biome-ignore lint/security/noDangerouslySetInnerHtml: snippets come from explicit account/LP configuration for published pages.
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      ) : null}
      {scripts.map((script) =>
        script.src ? (
          <Script
            key={script.key}
            id={script.key}
            src={script.src}
            strategy="afterInteractive"
          />
        ) : (
          <Script key={script.key} id={script.key} strategy="afterInteractive">
            {script.inline}
          </Script>
        ),
      )}
    </Fragment>
  );
}

/**
 * Injeta os scripts e snippets de tracking da LP publicada.
 *
 * @remarks
 * Só injeta provedores com toggle ativo e ID preenchido.
 */
export function LandingPageTracking({ office }: { office: Office }) {
  const tracking = normalizeTracking(office.tracking);
  const ga4Id =
    tracking.ga4.enabled && tracking.ga4.measurementId.trim()
      ? tracking.ga4.measurementId.trim()
      : "";
  const gtmId =
    tracking.gtm.enabled && tracking.gtm.containerId.trim()
      ? tracking.gtm.containerId.trim()
      : "";
  const metaPixelId =
    tracking.metaPixel.enabled && tracking.metaPixel.pixelId.trim()
      ? tracking.metaPixel.pixelId.trim()
      : "";
  const googleAdsId =
    tracking.googleAds.enabled && tracking.googleAds.adsId.trim()
      ? tracking.googleAds.adsId.trim()
      : "";

  const gtagLoaderId = ga4Id || googleAdsId;
  const gtagConfigs = [
    ga4Id ? `gtag('config', '${ga4Id}');` : "",
    googleAdsId ? `gtag('config', '${googleAdsId}');` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      {renderSnippet("lp-tracking-head", office.tags?.head)}

      {gtmId ? (
        <>
          <Script id="lp-gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        </>
      ) : null}

      {gtagLoaderId ? (
        <Script
          id="lp-gtag-loader"
          src={`https://www.googletagmanager.com/gtag/js?id=${gtagLoaderId}`}
          strategy="afterInteractive"
        />
      ) : null}

      {gtagConfigs ? (
        <Script id="lp-gtag-config" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${gtagConfigs}`}
        </Script>
      ) : null}

      {metaPixelId ? (
        <>
          <Script id="lp-meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* biome-ignore lint/performance/noImgElement: Meta Pixel noscript fallback requires a raw img tag. */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {renderSnippet("lp-tracking-body", office.tags?.body)}
      {renderSnippet("lp-tracking-footer", office.tags?.footer)}
    </>
  );
}
