/** Formata apenas a data do lead (dd/mm/aaaa, America/Sao_Paulo). */
export function fmtDataCurta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Formata data/hora de lead para exibição (dd/mm/aaaa HH:mm, America/Sao_Paulo). */
export function fmtData(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Monta link wa.me com saudação personalizada. */
export function waLink(tel: string | null, nome?: string | null): string {
  const d = (tel ?? "").replace(/\D/g, "");
  if (!d) return "#";
  const num = d.startsWith("55") ? d : `55${d}`;
  const saudacao = nome?.trim()
    ? `Olá ${nome.trim()}, recebi seu contato pelo meu site.`
    : "Olá, recebi seu contato pelo meu site.";
  return `https://wa.me/${num}?text=${encodeURIComponent(saudacao)}`;
}

/** Indica se há respostas customizadas não vazias. */
export function hasCustomAnswers(
  answers: Record<string, string> | null | undefined,
): boolean {
  if (!answers) return false;
  return Object.values(answers).some((v) => v.trim().length > 0);
}

/** Rótulo da LP a partir do page_url (1º segmento do path). */
export function lpLabelFromUrl(url: string | null): string {
  if (!url) return "—";
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean)[0];
    return seg || u.hostname.split(".")[0] || "—";
  } catch {
    return "—";
  }
}

/** Verifica se page_url corresponde ao slug da LP. */
export function pageUrlMatchesLpSlug(
  pageUrl: string | null,
  slug: string,
): boolean {
  if (!pageUrl || !slug) return false;
  try {
    const path = new URL(pageUrl).pathname.replace(/\/$/, "");
    return path === `/${slug}` || path.endsWith(`/${slug}`);
  } catch {
    return pageUrl.includes(`/${slug}`);
  }
}

/** Escapa campo para CSV. */
export function csvCell(v: string): string {
  const s = v ?? "";
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
