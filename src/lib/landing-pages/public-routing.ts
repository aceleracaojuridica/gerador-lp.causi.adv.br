/** Segmentos reservados do app — não são slugs de LP pública. */
const RESERVED_SEGMENTS = new Set([
  "login",
  "cadastrar",
  "confirmar",
  "redefinir",
  "nova",
  "galeria",
  "lp",
  "dashboard",
  "debug",
  "auth",
  "api",
  "onboarding",
  "cursos",
  "sem-acesso",
  "admin-cursos",
  "admin-contas",
  "conversas",
  "canais",
  "agentes",
  "tarefas",
  "pessoas",
  "organizacoes",
  "oportunidades",
  "funis",
  "etiquetas",
  "assinatura",
  "seguranca",
  "escritorio",
  "perfil",
  "usuarios",
]);

function hostWithoutPort(host: string): string {
  const lastColon = host.lastIndexOf(":");
  if (lastColon > -1 && /^\d+$/.test(host.slice(lastColon + 1))) {
    return host.slice(0, lastColon);
  }
  return host;
}

/** Domínio base do app e subdomínios (`NEXT_PUBLIC_APP_DOMAIN`). */
export function getLpPublicDomain(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim();
  if (fromEnv) return fromEnv.replace(/:\d+$/, "");

  const appUrl = process.env.APP_URL?.trim();
  if (!appUrl) return "";
  return appUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

/** URL absoluta do app principal (redirect da raiz do subdomínio do escritório). */
export function getMainAppUrl(): string {
  const raw = process.env.APP_URL?.trim();
  if (raw) {
    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return raw.replace(/\/$/, "");
    }
    const domain = raw.replace(/:\d+$/, "");
    const protocol = domain.startsWith("localhost") ? "http" : "https";
    return `${protocol}://${raw.replace(/\/$/, "")}`;
  }

  const domain = getLpPublicDomain() || "causi.adv.br";
  const protocol = domain.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${domain}`;
}

/** Subdomínio do escritório quando o host é `{escritorio}.{APP_DOMAIN}`. */
export function officeSubdomainFromHost(host: string): string | null {
  const hostname = hostWithoutPort(host);

  // Dev local: `{escritorio}.localhost` (independente de NEXT_PUBLIC_APP_DOMAIN).
  if (hostname.endsWith(".localhost")) {
    const office = hostname.slice(0, -".localhost".length);
    if (office && !office.includes(".")) return office;
  }

  const lpDomain = getLpPublicDomain();
  if (!lpDomain || lpDomain === "localhost") return null;

  if (!hostname.endsWith(`.${lpDomain}`)) return null;

  const office = hostname.slice(0, hostname.length - lpDomain.length - 1);
  if (!office || office.includes(".")) return null;
  return office;
}

/** Slug da LP em `/{lpSlug}` no host do escritório (um segmento, não reservado). */
export function parsePublicLpPath(pathname: string): string | null {
  const match = /^\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const segment = match[1];
  if (RESERVED_SEGMENTS.has(segment)) return null;
  return segment;
}

/** `/{slug}` no domínio principal — não serve LP pública (404). */
export function isPublicLpSlugPath(pathname: string): boolean {
  return parsePublicLpPath(pathname) !== null;
}

/** @deprecated Use officeSubdomainFromHost */
export const lpSubdomainSlug = officeSubdomainFromHost;
