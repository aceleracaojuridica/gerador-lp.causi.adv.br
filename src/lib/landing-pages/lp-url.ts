import { getLpPublicDomain } from "./public-routing";

type PublicHost = { domain: string; port: string };

/** Domínio/porta usados nas URLs públicas da LP (localhost no dev). */
function resolvePublicLpHost(): PublicHost {
  const envDomain =
    getLpPublicDomain() || process.env.NEXT_PUBLIC_APP_DOMAIN || "causi.adv.br";

  if (typeof window !== "undefined") {
    const { hostname, port } = window.location;
    if (hostname === "localhost" || hostname.endsWith(".localhost")) {
      return { domain: "localhost", port: port || "3000" };
    }
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && /localhost/i.test(appUrl)) {
    const portMatch = appUrl.match(/:(\d+)/);
    return { domain: "localhost", port: portMatch?.[1] ?? "3000" };
  }

  if (envDomain === "localhost") {
    return { domain: "localhost", port: "3000" };
  }

  return { domain: envDomain.replace(/:\d+$/, ""), port: "" };
}

/** Host público do escritório: `{officeSubdomain}.{domain}`. */
export function publicLpHost(officeSubdomain: string): string {
  const { domain, port } = resolvePublicLpHost();
  const host = `${officeSubdomain}.${domain}`;
  return port && domain === "localhost" ? `${host}:${port}` : host;
}

/** URL pública da LP: `{officeSubdomain}.{domain}/{lpSlug}`. */
export function publicLpUrl(officeSubdomain: string, lpSlug: string): string {
  const { domain } = resolvePublicLpHost();
  const protocol = domain === "localhost" ? "http" : "https";
  return `${protocol}://${publicLpHost(officeSubdomain)}/${lpSlug}`;
}

/**
 * Caminho (relativo) da página intermediária que redireciona ao WhatsApp:
 * `/whatsapp-landing/?whatsapp=NUMERO`. Fica no mesmo domínio da LP publicada,
 * então o caminho relativo resolve para `{subdominio}.causi.adv.br/...`.
 */
export function whatsappLandingPath(whatsapp: string): string {
  const digits = (whatsapp || "").replace(/\D/g, "");
  return `/whatsapp-landing/?whatsapp=${digits}`;
}

/** Exibição amigável: `escritorio.causi.adv.br/slug`. */
export function publicLpDisplayHost(
  officeSubdomain: string,
  lpSlug: string,
): string {
  return `${publicLpHost(officeSubdomain)}/${lpSlug}`;
}
