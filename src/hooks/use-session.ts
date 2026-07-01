/**
 * Hook de acesso à sessão do usuário autenticado.
 *
 * @remarks
 * Deve ser usado exclusivamente em Client Components dentro de um `SessionProvider`.
 * Para Server Components e Server Actions, use `getSession()` de `@/lib/session`.
 */
import { useSessionContext } from "@/components/session-provider";
import type { Session } from "@/lib/session/types";

export function useSession(): Session {
  return useSessionContext().session;
}
