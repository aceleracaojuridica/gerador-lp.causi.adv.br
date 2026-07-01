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

/** Domínio base das LPs publicadas (`NEXT_PUBLIC_APP_DOMAIN`). */
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

/** Slug da LP quando o host é `{slug}.{LP_DOMAIN}`. */
export function lpSubdomainSlug(host: string): string | null {
  const lpDomain = getLpPublicDomain();
  if (!lpDomain) return null;

  const hostname = hostWithoutPort(host);
  if (!hostname.endsWith(`.${lpDomain}`)) return null;

  const slug = hostname.slice(0, hostname.length - lpDomain.length - 1);
  if (!slug || slug.includes(".")) return null;
  return slug;
}

/** `/{slug}` — rota da LP publicada (acessível via subdomínio). */
export function isPublicLpSlugPath(pathname: string): boolean {
  const match = /^\/([^/]+)\/?$/.exec(pathname);
  if (!match) return false;
  return !RESERVED_SEGMENTS.has(match[1]);
}
