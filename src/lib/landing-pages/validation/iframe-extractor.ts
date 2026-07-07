/** Extrai o src de um código de iframe colado pelo usuário. */
export function extractIframeSrc(html: string): string | null {
  if (!html) return null;
  const s = html.trim();
  if (s.startsWith("http://") || s.startsWith("https://")) {
    return s;
  }
  const match = s.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

/** Valida se o src pertence ao domínio esperado. */
export function validateIframeDomain(
  src: string,
  expectedDomain: string,
): boolean {
  try {
    const url = new URL(src);
    return (
      url.hostname === expectedDomain ||
      url.hostname.endsWith(`.${expectedDomain}`)
    );
  } catch {
    return false;
  }
}
