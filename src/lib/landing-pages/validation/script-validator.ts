export const ALLOWED_SCRIPT_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "googlesyndication.com",
  "googleadservices.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com",
  "cloudflare.com",
  "linkedin.com",
  "sc-static.net",
  "tiktok.com",
  "calendar.google.com",
];

const BLOCKED_PATTERNS = [
  /\beval\s*\(/i,
  /\bdocument\.cookie\b/i,
  /\blocalStorage\b/i,
  /\bsessionStorage\b/i,
  /\bXMLHttpRequest\b/i,
];

export function parseSrcFromScriptTags(html: string): string[] {
  const urls: string[] = [];
  const srcRegex = /<(?:script|link)[^>]+(?:src|href)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex loop pattern
  while ((match = srcRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }
  return urls;
}

export function validateCustomScript(html: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!html || !html.trim()) {
    return { valid: true, errors: [] };
  }

  // 1. Verificar padrões bloqueados
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(html)) {
      errors.push(`Uso de código ou padrão inseguro detectado no script.`);
      break;
    }
  }

  // 2. Extrair e verificar as URLs dos scripts e links carregados
  const urls = parseSrcFromScriptTags(html);
  for (const urlStr of urls) {
    try {
      // Se for protocolo relativo //exemplo.com
      const absoluteUrl = urlStr.startsWith("//") ? `https:${urlStr}` : urlStr;

      // Se for caminho relativo na própria LP, ignora
      if (absoluteUrl.startsWith("/") && !absoluteUrl.startsWith("//")) {
        continue;
      }

      const url = new URL(absoluteUrl);
      if (url.protocol !== "https:") {
        errors.push(
          `Somente conexões seguras (https://) são permitidas: ${urlStr}`,
        );
        continue;
      }

      const hostname = url.hostname.toLowerCase();
      const isAllowed = ALLOWED_SCRIPT_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );

      if (!isAllowed) {
        errors.push(
          `Origem não autorizada: ${url.hostname}. Domínio precisa estar na allowlist.`,
        );
      }
    } catch {
      errors.push(`URL inválida no script/link: ${urlStr}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
