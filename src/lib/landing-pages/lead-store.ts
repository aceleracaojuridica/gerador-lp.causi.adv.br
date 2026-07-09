import "server-only";

import { mapLpDbError } from "@/lib/errors";
import { formatAnswerForDisplay } from "@/lib/landing-pages/popup/format-answers";
import { normalizeOfficeButtons } from "@/lib/landing-pages/popup/normalize";
import type { LpSchema, PopupQuestion } from "@/lib/landing-pages/schema";
import { pageUrlMatchesLpSlug } from "@/lib/leads/format";
import type { Session } from "@/lib/session/types";
import { lpAdmin } from "@/lib/supabase/admin";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

const LEADS_LIMIT = 2000;

function throwDbError(error: { message: string; code?: string }): never {
  throw new Error(mapLpDbError(error).description || error.message);
}

const safeSlug = (s: string) =>
  (s || "").replace(/[^a-z0-9-]/gi, "-").toLowerCase();

export type LeadRow = {
  id: number;
  created_at: string;
  nome: string | null;
  telefone: string | null;
  answers: Record<string, string>;
  page_url: string | null;
  subdomain: string | null;
};

export type LeadLandingPageOption = {
  slug: string;
  name: string;
  officeSubdomain: string;
};

export type LeadListFilters = {
  landingPageSlug?: string;
};

export type CreateLeadInput = {
  officeSubdomain: string;
  lpSlug: string;
  nome: string;
  telefone: string;
  answers?: Record<string, string>;
  pageUrl: string;
};

/** Converte respostas keyed por id em labels legíveis para o dashboard. */
export function normalizeLeadAnswers(
  raw: Record<string, string> | undefined,
  questions: PopupQuestion[],
): Record<string, string> {
  if (!raw) return {};
  const byId = new Map(questions.map((q) => [q.id, q]));

  return Object.fromEntries(
    Object.entries(raw)
      .filter(([, v]) => v.trim())
      .map(([id, v]) => {
        const q = byId.get(id);
        const label = q?.label.trim() || "Pergunta";
        const display = q ? formatAnswerForDisplay(q, v) : v.trim();
        return [label, display];
      }),
  );
}

async function getAccountSubdomains(
  accountId: number,
): Promise<{ subdomains: string[]; lps: LeadLandingPageOption[] }> {
  const db = lpAdmin();
  const { data, error } = await db
    .from("landing_pages")
    .select("slug, name, office_subdomain")
    .eq("account_id", accountId);
  if (error) throwDbError(error);

  const lps = (data ?? []).map((row) => ({
    slug: row.slug as string,
    name: (row.name as string) || (row.slug as string),
    officeSubdomain: row.office_subdomain as string,
  }));

  const subdomains = [
    ...new Set(lps.map((lp) => lp.officeSubdomain).filter(Boolean)),
  ];

  return { subdomains, lps };
}

/** Lista leads da conta ativa, opcionalmente filtrados por LP. */
export async function listLeads(
  session: Session,
  filters: LeadListFilters = {},
): Promise<{ leads: LeadRow[]; landingPages: LeadLandingPageOption[] }> {
  const ctx = sessionToLpContext(session);
  const { subdomains, lps } = await getAccountSubdomains(ctx.accountId);

  if (subdomains.length === 0) {
    return { leads: [], landingPages: lps };
  }

  const db = lpAdmin();
  const { data, error } = await db
    .from("leads")
    .select("id, created_at, nome, telefone, answers, page_url, subdomain")
    .in("subdomain", subdomains)
    .order("created_at", { ascending: false })
    .limit(LEADS_LIMIT);
  if (error) throwDbError(error);

  let leads = (data ?? []).map((row) => ({
    id: row.id as number,
    created_at: row.created_at as string,
    nome: row.nome as string | null,
    telefone: row.telefone as string | null,
    answers: (row.answers as Record<string, string>) ?? {},
    page_url: row.page_url as string | null,
    subdomain: row.subdomain as string | null,
  }));

  if (filters.landingPageSlug) {
    const slug = safeSlug(filters.landingPageSlug);
    leads = leads.filter((lead) => pageUrlMatchesLpSlug(lead.page_url, slug));
  }

  return { leads, landingPages: lps };
}

/** Captura pública de lead em LP publicada. */
export async function createLead(input: CreateLeadInput): Promise<number> {
  const office = safeSlug(input.officeSubdomain);
  const slug = safeSlug(input.lpSlug);
  const nome = input.nome.trim();
  const telefone = input.telefone.trim();

  if (!office || !slug) throw new Error("LP inválida.");
  if (!nome || !telefone) throw new Error("Nome e telefone são obrigatórios.");

  const db = lpAdmin();
  const { data: lpRow, error: lpError } = await db
    .from("landing_pages")
    .select("schema, office_subdomain, status")
    .eq("office_subdomain", office)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (lpError) throwDbError(lpError);
  if (!lpRow) throw new Error("Landing page não encontrada ou não publicada.");

  const schema = lpRow.schema as LpSchema;
  const buttons = normalizeOfficeButtons(schema.office.buttons);
  const questions = buttons?.popup?.questions ?? [];
  const answers = normalizeLeadAnswers(input.answers, questions);
  const pageUrl = input.pageUrl.trim() || null;

  const { data, error } = await db
    .from("leads")
    .insert({
      nome,
      telefone,
      answers,
      page_url: pageUrl,
      subdomain: lpRow.office_subdomain as string,
    })
    .select("id")
    .single();
  if (error) throwDbError(error);

  return data.id as number;
}

/** Remove lead se pertencer à conta ativa. */
export async function deleteLead(
  session: Session,
  leadId: number,
): Promise<void> {
  const ctx = sessionToLpContext(session);
  const { subdomains } = await getAccountSubdomains(ctx.accountId);
  if (subdomains.length === 0) throw new Error("Lead não encontrado.");

  const db = lpAdmin();
  const { data: lead, error: fetchError } = await db
    .from("leads")
    .select("id, subdomain")
    .eq("id", leadId)
    .maybeSingle();
  if (fetchError) throwDbError(fetchError);
  if (!lead?.subdomain || !subdomains.includes(lead.subdomain as string)) {
    throw new Error("Lead não encontrado.");
  }

  const { error } = await db.from("leads").delete().eq("id", leadId);
  if (error) throwDbError(error);
}
