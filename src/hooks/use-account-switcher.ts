"use client";

/**
 * Hook para troca de conta no SystemBar com cache em memória.
 *
 * @remarks
 * **Modo local** (todos os dados em memória): quando o total de contas retornadas no
 * primeiro fetch é igual ao total registrado no banco (`data.length >= total`).
 * Buscas subsequentes filtram localmente, sem fetch adicional.
 *
 * **Modo server-side**: quando há mais contas no banco do que carregadas na primeira página.
 * Buscas disparam fetch com `search`, e o infinite scroll carrega páginas adicionais.
 *
 * **Cache**: module-level, chave por `userId`, TTL de X minutos. Invalidado ao trocar
 * de conta e ao fazer logout (chamar `invalidateAccountCache(userId)` após `logoutAction`).
 */

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { useSessionContext } from "@/components/session-provider";
import {
  getUserAccountsAction,
  switchAccountAction,
} from "@/lib/session/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountSwitcherItem = { id: number; name: string };

type CacheEntry = {
  /** Todos os itens carregados até o momento (unfiltered). */
  accounts: AccountSwitcherItem[];
  /** Total de contas no banco para a query de abertura. */
  total: number;
  /** Timestamp do fetch inicial (Date.now()). */
  fetchedAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FIRST_PAGE_SIZE = 30;
const TTL_MS = 60 * 60 * 1000; // 60 minutos

// ─── Module-level cache ────────────────────────────────────────────────────────

const accountCache = new Map<string, CacheEntry>();

/**
 * Invalida o cache de contas de um usuário específico.
 * Deve ser chamado após `logoutAction` para garantir que o próximo login
 * carregue dados frescos.
 */
export function invalidateAccountCache(userId: string) {
  accountCache.delete(userId);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccountSwitcher() {
  const { session, setSession } = useSessionContext();
  const router = useRouter();
  const userId = session.user.id;

  // Full unfiltered list (used for local-mode filtering and cache)
  const [allAccounts, setAllAccounts] = React.useState<AccountSwitcherItem[]>(
    [],
  );
  // Displayed list (may be a filtered subset in local mode or server-filtered)
  const [accounts, setAccounts] = React.useState<AccountSwitcherItem[]>([]);
  const [total, setTotal] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [activeSearch, setActiveSearch] = React.useState("");

  // All data is in memory when allAccounts covers the full total
  const isLocalMode = total !== null && allAccounts.length >= total;
  const hasMore = total !== null && allAccounts.length < total && !activeSearch;

  const hint =
    !isLocalMode && !activeSearch && total !== null
      ? "Digite uma busca para encontrar mais resultados"
      : undefined;

  // ─── Load on open ─────────────────────────────────────────────────────────

  React.useEffect(() => {
    if (!open) return;

    const entry = accountCache.get(userId);
    const isFresh = !!entry && Date.now() - entry.fetchedAt < TTL_MS;

    if (isFresh && entry) {
      setAllAccounts(entry.accounts);
      setAccounts(entry.accounts);
      setTotal(entry.total);
      setPage(Math.ceil(entry.accounts.length / FIRST_PAGE_SIZE) || 1);
      return;
    }

    void (async () => {
      setIsLoading(true);
      const result = await getUserAccountsAction({
        page: 1,
        pageSize: FIRST_PAGE_SIZE,
      });
      setIsLoading(false);

      if ("error" in result) {
        toast.error("Falha ao carregar contas");
        return;
      }

      setAllAccounts(result.data);
      setAccounts(result.data);
      setTotal(result.total);
      setPage(1);

      accountCache.set(userId, {
        accounts: result.data,
        total: result.total,
        fetchedAt: Date.now(),
      });
    })();
  }, [open, userId]);

  // ─── Open / close ─────────────────────────────────────────────────────────

  const onOpenChange = React.useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveSearch("");
    }
    setOpen(nextOpen);
  }, []);

  // ─── Search ───────────────────────────────────────────────────────────────

  const onSearchChange = React.useCallback(
    async (query: string) => {
      setActiveSearch(query);

      if (!query) {
        setAccounts(allAccounts);
        return;
      }

      if (isLocalMode) {
        const lower = query.toLowerCase();
        setAccounts(
          allAccounts.filter((a) => a.name.toLowerCase().includes(lower)),
        );
        return;
      }

      setIsLoading(true);
      const result = await getUserAccountsAction({
        page: 1,
        pageSize: FIRST_PAGE_SIZE,
        search: query,
      });
      setIsLoading(false);

      if ("error" in result) {
        toast.error("Falha ao buscar contas");
        return;
      }

      setAccounts(result.data);
    },
    [allAccounts, isLocalMode],
  );

  // ─── Infinite scroll ──────────────────────────────────────────────────────

  const onScrollEnd = React.useCallback(async () => {
    if (isLoading || !hasMore || activeSearch) return;

    const nextPage = page + 1;
    setIsLoading(true);

    const result = await getUserAccountsAction({
      page: nextPage,
      pageSize: FIRST_PAGE_SIZE,
    });

    setIsLoading(false);

    if ("error" in result) {
      toast.error("Falha ao carregar mais contas");
      return;
    }

    const newAll = [...allAccounts, ...result.data];
    setAllAccounts(newAll);
    setAccounts(newAll);
    setPage(nextPage);

    // Keep original fetchedAt to respect TTL from initial open
    const existing = accountCache.get(userId);
    accountCache.set(userId, {
      accounts: newAll,
      total: total ?? newAll.length,
      fetchedAt: existing?.fetchedAt ?? Date.now(),
    });
  }, [isLoading, hasMore, activeSearch, page, allAccounts, total, userId]);

  // ─── Switch account ───────────────────────────────────────────────────────

  const switchAccount = React.useCallback(
    async (account: AccountSwitcherItem) => {
      if (account.id === session.account.id) {
        setOpen(false);
        return;
      }

      setIsSwitching(true);
      const result = await switchAccountAction({ accountId: account.id });
      setIsSwitching(false);

      if ("error" in result) {
        toast.error("Não foi possível trocar de conta");
        return;
      }

      setSession(() => result.session);
      setOpen(false);
      router.refresh();
    },
    [session.account.id, setSession, router],
  );

  return {
    accounts,
    isLoading,
    isSwitching,
    hint,
    open,
    onOpenChange,
    onSearchChange,
    onScrollEnd,
    switchAccount,
  };
}
