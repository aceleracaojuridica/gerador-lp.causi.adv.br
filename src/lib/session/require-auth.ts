import "server-only";

import { redirect } from "next/navigation";
import { hasLpAccess } from "./access";
import { getSession } from "./get-session";
import type { Session } from "./types";

/**
 * Guard para Server Components: exige usuário autenticado.
 * Sem sessão → `/login`. Não valida plano — combine com `hasLpAccess(session)`.
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Guard para rotas de edição/config: exige plano LP ou redireciona para `/`. */
export async function requireLpAccessOrRedirect(): Promise<Session> {
  const session = await requireAuth();
  if (!hasLpAccess(session)) redirect("/");
  return session;
}

/**
 * Guard para Server Actions e Route Handlers: exige autenticação e plano LP.
 * Lança `UNAUTHENTICATED` ou `FORBIDDEN` para o chamador converter em JSON.
 */
export async function requireLpSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (!hasLpAccess(session)) throw new Error("FORBIDDEN");
  return session;
}
