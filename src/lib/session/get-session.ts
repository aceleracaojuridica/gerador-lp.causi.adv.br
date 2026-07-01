/**
 * DAL de sessão — busca e mapeia os dados do usuário autenticado via RPC.
 *
 * @remarks
 * Marcado como `server-only` para impedir importação por Client Components.
 * `getSession()` é wrapped em `cache()` do React — deduplica chamadas dentro da
 * mesma árvore de render do mesmo request sem compartilhar dados entre usuários.
 * Retorna `null` se `auth.getUser()` falhar ou a RPC retornar vazio (provisioning incompleto).
 *
 * ### Persistência de contexto de conta (`causi_act`)
 * Lê o cookie HTTP-only `causi_act` (setado por `switchAccountAction`) e passa o
 * `accountId` como `p_account_id` à RPC — preservando a conta selecionada entre
 * requests (F5, navegação, `router.refresh()`). Fluxo de fallback:
 * 1. Cookie presente e RPC retorna dados → usa essa conta.
 * 2. Cookie presente mas RPC retorna null (acesso revogado) → ignora o cookie,
 *    reexecuta a RPC sem parâmetro (conta principal) e sinaliza limpeza via
 *    `shouldClearStaleAccountCookie()` + `clearActiveAccountCookieAction`.
 * 3. Cookie ausente → RPC sem parâmetro (conta principal).
 */
import type { User } from "@supabase/supabase-js";
import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { resolveMediaPublicUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import type {
  Session,
  SessionAccount,
  SessionFeatures,
  SessionLimits,
  SessionPlan,
  SessionRole,
  SessionSubscription,
  SessionUsage,
  SessionUser,
} from "./types";

export type CurrentUserDetailsRow = {
  id: string;
  name: string;
  email: string;
  photo: string | null;
  account_id: number | string;
  account_name: string;
  account_status: string | null;
  role: unknown;
  role_permissions: unknown;
  subscription: unknown;
  account_usage: unknown;
  plan_limits: unknown;
  plan_features: unknown;
  has_shared_accounts: boolean | null;
};

/**
 * Mapeia a linha raw da RPC `get_current_user_details_v4` para o DTO `Session`.
 *
 * @remarks
 * Campos internos do banco (`main_account_id`, `main_role_id`, `slug`, `status`,
 * `has_used_trial`) são omitidos intencionalmente — não devem ser expostos ao client.
 * Campos `Json` da RPC são convertidos via `as unknown as T` por ausência de tipos
 * gerados para structs jsonb aninhados.
 */
export function mapRpcToSession(row: CurrentUserDetailsRow): Session {
  const rawRole = row.role as {
    id: number;
    name: string;
    slug: string;
    access_level: number;
  } | null;

  const user: SessionUser = {
    id: row.id,
    name: row.name,
    email: row.email,
    photo: resolveMediaPublicUrl(row.photo ?? null),
  };

  const account: SessionAccount = {
    id: Number(row.account_id),
    name: row.account_name,
    status: row.account_status ?? null,
  };

  const role: SessionRole = {
    id: rawRole?.id ?? 0,
    slug: rawRole?.slug ?? "user",
    accessLevel: rawRole?.access_level ?? 0,
    permissions:
      (row.role_permissions as unknown as Record<string, string[]>) ?? {},
  };

  const subscription = (row.subscription as unknown as SessionSubscription) ?? {
    status: null,
  };

  const rawSub = row.subscription as {
    plan_id?: number | null;
    plan_name?: string | null;
    plan_slug?: string | null;
    plan_tier_level?: number | null;
    status?: string | null;
  } | null;

  const plan: SessionPlan | null =
    rawSub?.plan_id != null
      ? {
          id: rawSub.plan_id,
          name: rawSub.plan_name ?? null,
          slug: rawSub.plan_slug ?? null,
          tierLevel: rawSub.plan_tier_level ?? null,
          status: rawSub.status ?? null,
        }
      : null;

  const usage = (row.account_usage as unknown as SessionUsage) ?? {
    agents_count: null,
    channels_count: null,
    deals_count: null,
    persons_count: null,
    pipelines_count: null,
    users_count: null,
  };

  const limits = (row.plan_limits as unknown as SessionLimits) ?? {
    max_contacts: null,
    max_users: null,
    max_channels: null,
    max_pipelines: null,
  };

  const features = (row.plan_features as unknown as SessionFeatures) ?? {};

  return {
    user,
    account,
    role,
    plan,
    subscription,
    usage,
    limits,
    features,
    hasSharedAccounts: row.has_shared_accounts ?? false,
  };
}

function buildFallbackSession(user: User): Session {
  return {
    user: {
      id: user.id,
      name: (user.user_metadata?.name as string) ?? "",
      email: user.email ?? "",
      photo: null,
    },
    account: { id: 0, name: "", status: null },
    role: { id: 0, slug: "user", accessLevel: 0, permissions: {} },
    plan: null,
    subscription: { status: null },
    usage: {
      agents_count: null,
      channels_count: null,
      deals_count: null,
      persons_count: null,
      pipelines_count: null,
      users_count: null,
    },
    limits: {
      max_contacts: null,
      max_users: null,
      max_channels: null,
      max_pipelines: null,
    },
    features: {},
    hasSharedAccounts: false,
  };
}

type SessionLoadResult = {
  session: Session | null;
  staleAccountCookie: boolean;
};

const loadSession = cache(async (): Promise<SessionLoadResult> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { session: null, staleAccountCookie: false };
  }

  const fallback = buildFallbackSession(user);

  const jar = await cookies();
  const raw = jar.get("causi_act")?.value;
  const accountId = raw ? Number(raw) : null;
  const hasAccountId =
    accountId !== null && Number.isInteger(accountId) && accountId > 0;

  if (hasAccountId) {
    const { data, error } = await supabase
      .rpc("get_current_user_details_v4", { p_account_id: accountId })
      .maybeSingle();

    if (!error && data) {
      return {
        session: mapRpcToSession(data as unknown as CurrentUserDetailsRow),
        staleAccountCookie: false,
      };
    }
  }

  const staleAccountCookie = hasAccountId;

  const { data, error } = await supabase
    .rpc("get_current_user_details_v4")
    .maybeSingle();

  if (error || !data) {
    return { session: fallback, staleAccountCookie };
  }

  return {
    session: mapRpcToSession(data as unknown as CurrentUserDetailsRow),
    staleAccountCookie,
  };
});

export const getSession = cache(async (): Promise<Session | null> => {
  return (await loadSession()).session;
});

/** Indica cookie `causi_act` inválido; limpar via `clearActiveAccountCookieAction` no client. */
export const shouldClearStaleAccountCookie = cache(
  async (): Promise<boolean> => {
    return (await loadSession()).staleAccountCookie;
  },
);
