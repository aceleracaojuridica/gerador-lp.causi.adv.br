/**
 * Server Actions de sessão: listagem de contas e troca de contexto de conta.
 *
 * @remarks
 * `getUserAccountsAction`: retorna lista paginada (20/página) com busca para Super Admin
 * (`accessLevel === 999`). Para usuários comuns, consolida conta principal (`users.account_id`)
 * e contas adicionais (`users_accounts`), deduplicadas por id, conta principal sempre primeiro.
 *
 * `switchAccountAction`: re-chama a RPC com o `account_id` solicitado e persiste a escolha
 * no cookie HTTP-only `causi_act` (maxAge 30 dias). Proteção IDOR delegada ao banco —
 * RPC + RLS retornam `null` para contas inacessíveis → resposta `{ error: 'Forbidden' }`.
 * Todos os inputs validados com Zod.
 *
 * `syncSessionCookieAction`: chamada no mount do `SessionProvider`. Inicializa o cookie
 * `causi_act` com a conta principal apenas se o cookie **ainda não existir** — garante
 * que o cookie esteja sempre populado desde o primeiro login sem sobrescrever uma troca prévia.
 *
 * ### Ciclo de vida do cookie `causi_act`
 * - Criado: `switchAccountAction` (ao trocar) ou `syncSessionCookieAction` (no login inicial).
 * - Persistido: entre requests, F5 e navegações enquanto logado.
 * - Limpo: `logoutAction`, `clearActiveAccountCookieAction` (cookie inválido/revogado).
 */
"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { deletePipelineCookie } from "@/lib/pipeline-cookie";
import { createClient } from "@/lib/supabase/server";
import {
  type CurrentUserDetailsRow,
  getSession,
  mapRpcToSession,
} from "./get-session";
import type { Session } from "./types";

const COOKIE_NAME = "causi_act";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

const getUserAccountsSchema = z.object({
  page: z.int().positive().default(1),
  search: z.string().optional(),
  pageSize: z.int().positive().default(30),
});

const switchAccountSchema = z.object({
  accountId: z.int().positive(),
});

type AccountItem = {
  id: number;
  name: string;
};

type GetUserAccountsResult =
  | { data: AccountItem[]; total: number }
  | { error: string };

export async function getUserAccountsAction(
  input: unknown,
): Promise<GetUserAccountsResult> {
  const parsed = getUserAccountsSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  const { page, search, pageSize } = parsed.data;
  const supabase = await createClient();

  if (session.role.accessLevel === 999) {
    const PAGE_SIZE = pageSize;
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("accounts")
      .select("id, name", { count: "exact" })
      .range(from, to)
      .order("name");

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return { error: "Failed to fetch accounts" };
    }

    return {
      data: (data ?? []).map((a) => ({ id: Number(a.id), name: a.name })),
      total: count ?? 0,
    };
  }

  // Fetch main account from users table
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("account_id, accounts!account_id(id, name)")
    .eq("id", session.user.id)
    .single();

  const mainAcc =
    !userError && userData
      ? (userData.accounts as unknown as { id: number; name: string } | null)
      : null;

  const mainAccount: AccountItem | null = mainAcc
    ? { id: Number(mainAcc.id), name: mainAcc.name }
    : null;

  // Fetch additional accounts from users_accounts
  const { data, error } = await supabase
    .from("users_accounts")
    .select("account_id, accounts!inner(id, name)")
    .eq("user_id", session.user.id);

  if (error) {
    return { error: "Failed to fetch accounts" };
  }

  const additionalAccounts = (data ?? []).flatMap((row) => {
    const acc = row.accounts as unknown as { id: number; name: string } | null;
    return acc ? [{ id: Number(acc.id), name: acc.name }] : [];
  });

  // Merge: main account first, then additional accounts (deduplicated)
  const seen = new Set<number>();
  const accounts: AccountItem[] = [];
  for (const acc of [mainAccount, ...additionalAccounts]) {
    if (acc && !seen.has(acc.id)) {
      seen.add(acc.id);
      accounts.push(acc);
    }
  }

  return { data: accounts, total: accounts.length };
}

type SwitchAccountResult = { session: Session } | { error: string };

export async function switchAccountAction(
  input: unknown,
): Promise<SwitchAccountResult> {
  const parsed = switchAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const { accountId } = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase
    .rpc("get_current_user_details_v4", { p_account_id: accountId })
    .maybeSingle();

  if (error || !data) {
    return { error: "Forbidden" };
  }

  const jar = await cookies();
  jar.set(COOKIE_NAME, String(accountId), COOKIE_OPTIONS);

  // O funil ativo pertence à conta anterior — limpa para forçar redirect ao
  // funil mais antigo da nova conta no próximo acesso a /oportunidades.
  await deletePipelineCookie();

  return { session: mapRpcToSession(data as unknown as CurrentUserDetailsRow) };
}

export async function clearActiveAccountCookieAction(): Promise<{ ok: true }> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
  return { ok: true };
}

export async function syncSessionCookieAction(
  input: unknown,
): Promise<{ ok: true } | { error: string }> {
  const parsed = switchAccountSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  const jar = await cookies();
  if (!jar.has(COOKIE_NAME)) {
    jar.set(COOKIE_NAME, String(parsed.data.accountId), COOKIE_OPTIONS);
  }

  return { ok: true };
}
