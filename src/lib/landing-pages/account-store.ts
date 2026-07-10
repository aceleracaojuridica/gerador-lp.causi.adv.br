import "server-only";

import { fetchCausiOfficeSubdomainAvailability } from "@/lib/causi/check-office-subdomain";
import {
  allocateUniqueLpSlug,
  slugFromOfficeName,
} from "@/lib/landing-pages/slug";
import {
  normalizeOfficeSubdomainInput,
  validateOfficeSubdomainLocal,
} from "@/lib/landing-pages/subdomain";
import { hasLpAccess } from "@/lib/session/access";
import type { Session } from "@/lib/session/types";
import { getCausiAccessToken } from "@/lib/supabase/causi-access-token";
import {
  createLpServiceClient,
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { createClient } from "@/lib/supabase/server";

type LpAccountRow = {
  id: number;
  name: string;
  office_subdomain: string | null;
};

const OFFICE_SUBDOMAIN_BACKFILL_PREFIX = "acct-";

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

export function isBackfillOfficeSubdomain(value: string): boolean {
  return value.startsWith(OFFICE_SUBDOMAIN_BACKFILL_PREFIX);
}

/** Lê `public.accounts.slug` no Causi (Projeto A). */
async function getCausiAccountSlug(accountId: number): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("slug")
    .eq("id", accountId)
    .maybeSingle<{ slug: string }>();

  if (error || !data?.slug?.trim()) return null;
  return normalizeOfficeSubdomainInput(data.slug);
}

/** Slug canônico do Causi (`accounts.slug`) com fallback para o nome da conta. */
async function resolveOfficeSubdomainBase(session: Session): Promise<string> {
  const causiSlug = await getCausiAccountSlug(session.account.id);
  if (causiSlug) {
    const local = validateOfficeSubdomainLocal(causiSlug);
    if (local.ok) return local.normalized;
  }

  const fromName = slugFromOfficeName(session.account.name);
  if (!fromName) {
    throw new Error("Nome da conta inválido para subdomínio do escritório.");
  }
  return fromName;
}

async function allocateOfficeSubdomainForAccount(
  session: Session,
  base: string,
): Promise<string> {
  const ctx = sessionToLpContext(session);
  const ownerBase =
    slugFromOfficeName(
      session.user.name || session.user.email.split("@")[0] || "",
    ) || "owner";

  const isTaken = async (candidate: string) => {
    const [takenBySubdomain, reservedByName] = await Promise.all([
      isOfficeSubdomainTakenByOtherAccount(candidate, ctx.accountId),
      isOfficeSubdomainReservedByAccountName(candidate, ctx.accountId),
    ]);
    return takenBySubdomain || reservedByName;
  };

  const subdomain = await allocateUniqueLpSlug(base, isTaken);
  if (subdomain) return subdomain;

  const fallback = await allocateUniqueLpSlug(`${base}-${ownerBase}`, isTaken);
  if (!fallback) throw new Error("subdomain-conflict");
  return fallback;
}

/**
 * Provisiona `office_subdomain` na primeira visita a partir de `accounts.slug`
 * do Causi (fallback: nome da conta slugificado).
 */
export async function provisionOfficeSubdomainIfNeeded(
  session: Session,
): Promise<void> {
  const ctx = sessionToLpContext(session);
  const admin = createLpServiceClient();

  const { data: existing, error: readError } = await admin
    .from("lp_accounts")
    .select("office_subdomain")
    .eq("id", ctx.accountId)
    .maybeSingle<{ office_subdomain: string | null }>();

  if (readError) throwDbError(readError);

  const current = existing?.office_subdomain?.trim();
  if (current && !isBackfillOfficeSubdomain(current)) {
    return;
  }

  let base: string;
  try {
    base = await resolveOfficeSubdomainBase(session);
  } catch {
    return;
  }

  let subdomain: string;
  try {
    subdomain = await allocateOfficeSubdomainForAccount(session, base);
  } catch {
    return;
  }

  const { error } = await admin
    .from("lp_accounts")
    .update({
      office_subdomain: subdomain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.accountId);

  if (error) throwDbError(error);
}

/**
 * Garante o espelho da conta Causi no Projeto B e sincroniza o entitlement de acesso.
 * `lp_access_enabled` é gravado apenas via service role (não forjável pelo client).
 */
export async function ensureLpAccount(session: Session): Promise<void> {
  const ctx = sessionToLpContext(session);
  const admin = createLpServiceClient();

  const { error } = await admin.from("lp_accounts").upsert(
    {
      id: ctx.accountId,
      name: session.account.name,
      synced_at: new Date().toISOString(),
      lp_access_enabled: hasLpAccess(session),
    },
    { onConflict: "id" },
  );

  if (error) throwDbError(error);
  await provisionOfficeSubdomainIfNeeded(session);
}

/** Lê a conta LP canônica da sessão atual. */
export async function getLpAccount(
  session: Session,
): Promise<LpAccountRow | null> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data, error } = await db
    .from("lp_accounts")
    .select("id,name,office_subdomain")
    .eq("id", ctx.accountId)
    .maybeSingle<LpAccountRow>();

  if (error) throwDbError(error);
  return data ?? null;
}

/** Atualiza subdomínio canônico da conta atual (owner/super admin via RLS). */
export async function updateLpAccountOfficeSubdomain(
  session: Session,
  officeSubdomain: string,
): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { error } = await db
    .from("lp_accounts")
    .update({
      office_subdomain: officeSubdomain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", ctx.accountId);

  if (error) throwDbError(error);
}

/** Verifica conflito global de subdomínio com outras contas ou profiles Lovable. */
export async function isOfficeSubdomainTakenByOtherAccount(
  subdomain: string,
  accountId: number,
): Promise<boolean> {
  const db = createLpServiceClient();
  const [lpConflict, profileConflict] = await Promise.all([
    db
      .from("lp_accounts")
      .select("id")
      .eq("office_subdomain", subdomain)
      .neq("id", accountId)
      .limit(1)
      .maybeSingle(),
    db
      .from("profiles")
      .select("id")
      .eq("subdomain", subdomain)
      .limit(1)
      .maybeSingle(),
  ]);

  if (lpConflict.error) throwDbError(lpConflict.error);
  if (profileConflict.error) throwDbError(profileConflict.error);
  return !!lpConflict.data || !!profileConflict.data;
}

/**
 * Reserva subdomínios derivados do nome ou slug de outras contas no Causi.
 * A consulta roda via Edge Function do Projeto A (sem service role local).
 */
export async function isOfficeSubdomainReservedByAccountName(
  subdomain: string,
  accountId: number,
): Promise<boolean> {
  const accessToken = await getCausiAccessToken();
  if (!accessToken) {
    throw new Error("UNAUTHENTICATED");
  }

  const available = await fetchCausiOfficeSubdomainAvailability({
    accessToken,
    subdomain,
    accountId,
  });

  return !available;
}
