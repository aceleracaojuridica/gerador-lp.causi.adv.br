import Script from "next/script";
import type { Office } from "@/lib/landing-pages/schema";

function renderSnippet(id: string, html: string | undefined) {
  if (!html?.trim()) return null;
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: snippets come from explicit account/LP configuration for published pages.
    <div
      key={id}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Injeta os scripts e snippets de tracking da LP publicada.
 *
 * @remarks
 * O projeto prioriza IDs estruturados por provedor e só mantém snippets HTML
 * como recurso avançado. Os snippets são renderizados apenas na rota pública.
 */
export function LandingPageTracking({ office }: { office: Office }) {
  const tracking = office.tracking;
  const gtagLoaderId =
    tracking?.ga4MeasurementId || tracking?.googleAdsId || "";
  const gtagConfigs = [
    tracking?.ga4MeasurementId
      ? `gtag('config', '${tracking.ga4MeasurementId}');`
      : "",
    tracking?.googleAdsId ? `gtag('config', '${tracking.googleAdsId}');` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      {renderSnippet("lp-tracking-head", office.tags?.head)}

      {tracking?.gtmContainerId ? (
        <>
          <Script id="lp-gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${tracking.gtmContainerId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${tracking.gtmContainerId}`}
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

      {tracking?.metaPixelId ? (
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
fbq('init', '${tracking.metaPixelId}');
fbq('track', 'PageView');`}
          </Script>
          <noscript>
            {/* biome-ignore lint/performance/noImgElement: Meta Pixel noscript fallback requires a raw img tag. */}
            <img
              alt=""
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${tracking.metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {renderSnippet("lp-tracking-body", office.tags?.body)}
      {renderSnippet("lp-tracking-footer", office.tags?.footer)}
    </>
  );
}
