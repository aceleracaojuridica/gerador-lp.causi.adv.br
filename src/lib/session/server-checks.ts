/**
 * Utilitários server-only de verificação de sessão, permissões, features e limites.
 *
 * @remarks
 * Marcado como `server-only` — use em Server Components e Server Actions.
 * Para Client Components, use `useAccessControl()` de `@/hooks/use-access-control`.
 * `serverIsWithinLimit` usa a mesma tabela de mapeamento de chaves que o hook client-side:
 * `deals → max_contacts`, `agents → max_channels` (proxy), `persons → 20_000` (hardcoded).
 */
import "server-only";

import { redirect } from "next/navigation";
import type { Session } from "./types";

export function requireSession(
  session: Session | null,
): asserts session is Session {
  if (!session) {
    redirect("/login");
  }
}

export function serverHasPermission(
  session: Session,
  resource: string,
  action: string,
): boolean {
  const actions = session.role.permissions[resource];
  return Array.isArray(actions) && actions.includes(action);
}

/** Super admin ou permissão de criar/editar agentes (mesma regra do CRUD). */
export function serverCanManageAgents(session: Session): boolean {
  if (session.role.accessLevel >= 999) {
    return true;
  }

  return (
    serverHasPermission(session, "agents", "update") ||
    serverHasPermission(session, "agents", "create")
  );
}

export function serverHasFeature(session: Session, feature: string): boolean {
  return session.features[feature] === true;
}

const LIMIT_MAP: Record<string, (session: Session) => boolean> = {
  deals: (s) =>
    (s.usage.deals_count ?? 0) < (s.limits.max_contacts ?? Infinity),
  users: (s) => (s.usage.users_count ?? 0) < (s.limits.max_users ?? Infinity),
  channels: (s) =>
    (s.usage.channels_count ?? 0) < (s.limits.max_channels ?? Infinity),
  agents: (s) =>
    (s.usage.agents_count ?? 0) < (s.limits.max_channels ?? Infinity),
  pipelines: (s) =>
    (s.usage.pipelines_count ?? 0) < (s.limits.max_pipelines ?? Infinity),
  persons: (s) => (s.usage.persons_count ?? 0) < 20_000,
};

export function serverIsWithinLimit(
  session: Session,
  resource: string,
): boolean {
  return LIMIT_MAP[resource]?.(session) ?? true;
}
