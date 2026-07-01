import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getLpAdminEnv, getLpUserEnv } from "@/lib/env";
import type { Session } from "@/lib/session/types";
import { signLpUserJwt } from "./lp-jwt";

export type LpDbClient = SupabaseClient;

/** Contexto de escopo para operações no Projeto B. */
export type LpContext = {
  userId: string;
  accountId: number;
  accessLevel: number;
  roleSlug: string;
};

export function sessionToLpContext(session: Session): LpContext {
  return {
    userId: session.user.id,
    accountId: session.account.id,
    accessLevel: session.role.accessLevel,
    roleSlug: session.role.slug,
  };
}

/** Cliente autenticado com JWT assinado — respeita RLS do Projeto B. */
export function createLpUserClient(session: Session): LpDbClient {
  const { url, anonKey, jwtSecret } = getLpUserEnv();
  const token = signLpUserJwt(
    {
      sub: session.user.id,
      account_id: session.account.id,
      access_level: session.role.accessLevel,
      role_slug: session.role.slug,
    },
    jwtSecret,
  );

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Cliente anônimo — leitura pública de LPs publicadas. */
export function createLpAnonClient(): LpDbClient {
  const { url, anonKey } = getLpUserEnv();
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Service role — apenas leitura pública, migração e jobs. */
export function createLpServiceClient(): LpDbClient {
  const { url, key } = getLpAdminEnv();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
