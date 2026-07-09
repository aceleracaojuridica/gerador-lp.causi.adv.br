import "server-only";

import { fetchCausiOfficeSubdomainAvailability } from "@/lib/causi/check-office-subdomain";
import type { Session } from "@/lib/session/types";
import { getCausiAccessToken } from "@/lib/supabase/causi-access-token";
import {
  createLpServiceClient,
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";

type LpAccountRow = {
  id: number;
  name: string;
  office_subdomain: string | null;
};

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

/**
 * Garante o espelho da conta Causi no Projeto B.
 * Atualiza nome/synced_at sem sobrescrever office_subdomain.
 */
export async function ensureLpAccount(session: Session): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { error } = await db.from("lp_accounts").upsert(
    {
      id: ctx.accountId,
      name: session.account.name,
      synced_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) throwDbError(error);
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
