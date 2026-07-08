import "server-only";

import type { Session } from "@/lib/session/types";
import {
  createLpServiceClient,
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { slugFromOfficeName } from "./slug";

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
    .update({ office_subdomain: officeSubdomain, updated_at: new Date().toISOString() })
    .eq("id", ctx.accountId);

  if (error) throwDbError(error);
}

/** Verifica conflito global de subdomínio com outras contas. */
export async function isOfficeSubdomainTakenByOtherAccount(
  subdomain: string,
  accountId: number,
): Promise<boolean> {
  const db = createLpServiceClient();
  const { data, error } = await db
    .from("lp_accounts")
    .select("id")
    .eq("office_subdomain", subdomain)
    .neq("id", accountId)
    .limit(1)
    .maybeSingle();

  if (error) throwDbError(error);
  return !!data;
}

/**
 * Reserva nomes derivados do nome oficial do escritório em outras contas.
 * Evita apropriar subdomínio que outro escritório teria por slugificação.
 */
export async function isOfficeSubdomainReservedByAccountName(
  subdomain: string,
  accountId: number,
): Promise<boolean> {
  const db = createLpServiceClient();
  const { data, error } = await db
    .from("lp_accounts")
    .select("id,name")
    .neq("id", accountId);

  if (error) throwDbError(error);

  return (data ?? []).some((row) => {
    const name = (row as { name?: string | null }).name ?? "";
    return slugFromOfficeName(name) === subdomain;
  });
}
