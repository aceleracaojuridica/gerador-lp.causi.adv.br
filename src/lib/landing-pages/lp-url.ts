/** URL pública da LP: `{officeSubdomain}.{domain}/{lpSlug}`. */
export function publicLpUrl(officeSubdomain: string, lpSlug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "causi.adv.br";
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  const host = publicLpHost(officeSubdomain);
  return `${protocol}://${host}/${lpSlug}`;
}

/** Host público do escritório: `{officeSubdomain}.{domain}`. */
export function publicLpHost(officeSubdomain: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "causi.adv.br";
  return `${officeSubdomain}.${domain.replace(/:\d+$/, "")}`;
}

/** Exibição amigável: `escritorio.causi.adv.br/slug`. */
export function publicLpDisplayHost(
  officeSubdomain: string,
  lpSlug: string,
): string {
  return `${publicLpHost(officeSubdomain)}/${lpSlug}`;
}
