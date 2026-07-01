/** URL pública da LP publicada: `{slug}.{NEXT_PUBLIC_APP_DOMAIN}`. */
export function publicLpUrl(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "causi.adv.br";
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${slug}.${domain}`;
}

export function publicLpHost(slug: string): string {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "causi.adv.br";
  return `${slug}.${domain}`;
}
