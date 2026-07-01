/**
 * Provedor de sessão: distribui o snapshot `Session` para todos os Client Components
 * descendentes sem prop drilling.
 *
 * @remarks
 * Aceita `session` inicial do Server Component do layout (carregada via `getSession()`).
 * `setSession` recebe um updater funcional — use para atualizações otimistas após mutations
 * (ex: incrementar `usage.deals_count` após criar um deal) sem re-executar o layout.
 * `useSessionContext()` lança erro descritivo se chamado fora da árvore do provider.
 *
 * No mount, chama `syncSessionCookieAction` com o `account.id` da sessão inicial para
 * garantir que o cookie `causi_act` esteja populado desde o primeiro login. A action
 * tem um guard interno e não sobrescreve um cookie já existente (troca prévia).
 */
"use client";

import {
  createContext,
  type Dispatch,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clearActiveAccountCookieAction,
  syncSessionCookieAction,
} from "@/lib/session/actions";
import type { Session, SessionUpdater } from "@/lib/session/types";

interface SessionContextValue {
  session: Session;
  setSession: Dispatch<SessionUpdater>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  session: Session;
  children: React.ReactNode;
  /** Cookie `causi_act` inválido detectado no servidor — limpar após hidratação. */
  clearStaleAccountCookie?: boolean;
}

export function SessionProvider({
  session: initialSession,
  children,
  clearStaleAccountCookie = false,
}: SessionProviderProps) {
  const [session, setSessionState] = useState<Session>(initialSession);

  const setSession: Dispatch<SessionUpdater> = useCallback((updater) => {
    setSessionState((prev) => updater(prev));
  }, []);

  // 1. Captura o ID inicial em um ref — imune a re-renders
  const initialAccountIdRef = useRef(initialSession.account.id);

  // O Server Component já entregou o HTML — o cookie só pode ser escrito após a hidratação,
  // invocando a Server Action pelo cliente. Não sobrescreve se o cookie já existir.
  useEffect(() => {
    const run = () => {
      if (clearStaleAccountCookie) {
        void clearActiveAccountCookieAction();
        return;
      }

      void syncSessionCookieAction({
        accountId: initialAccountIdRef.current,
      });
    };

    if (requestIdleCallback && cancelIdleCallback) {
      const handle = requestIdleCallback(run, { timeout: 2000 });
      return () => cancelIdleCallback(handle);
    }

    const timeout = window.setTimeout(run, 0);
    return () => window.clearTimeout(timeout);
  }, [clearStaleAccountCookie]);

  const value = useMemo(() => ({ session, setSession }), [session, setSession]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSessionContext(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error(
      "useSession must be used within a <SessionProvider>. Wrap your layout with <SessionProvider session={session}>.",
    );
  }
  return ctx;
}
