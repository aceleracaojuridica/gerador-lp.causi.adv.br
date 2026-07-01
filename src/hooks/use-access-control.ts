/**
 * Hook de controle de acesso: verifica permissões, feature gates e limites de plano.
 *
 * @remarks
 * Todas as funções são puras — derivadas do snapshot `Session` atual sem chamadas ao banco.
 * Tabela de mapeamento `resource → limit`: `deals → max_contacts`, `agents → max_channels`
 * (proxy temporário), `persons → 20_000` (hardcoded no app).
 * Counterpart server-side: `serverHasPermission`, `serverHasFeature`, `serverIsWithinLimit`
 * em `@/lib/session/server-checks`.
 */
import { useSession } from "./use-session";

type LimitResource =
  | "deals"
  | "users"
  | "channels"
  | "agents"
  | "pipelines"
  | "persons";

export function useAccessControl() {
  const session = useSession();

  function hasPermission(resource: string, action: string): boolean {
    const actions = session.role.permissions[resource];
    return Array.isArray(actions) && actions.includes(action);
  }

  function hasFeature(feature: string): boolean {
    return session.features[feature] === true;
  }

  function canManageAgents(): boolean {
    if (session.role.accessLevel >= 999) {
      return true;
    }

    return (
      hasPermission("agents", "update") || hasPermission("agents", "create")
    );
  }

  function isWithinLimit(resource: LimitResource): boolean {
    switch (resource) {
      case "deals":
        return (
          (session.usage.deals_count ?? 0) <
          (session.limits.max_contacts ?? Infinity)
        );
      case "users":
        return (
          (session.usage.users_count ?? 0) <
          (session.limits.max_users ?? Infinity)
        );
      case "channels":
        return (
          (session.usage.channels_count ?? 0) <
          (session.limits.max_channels ?? Infinity)
        );
      case "agents":
        return (
          (session.usage.agents_count ?? 0) <
          (session.limits.max_channels ?? Infinity)
        );
      case "pipelines":
        return (
          (session.usage.pipelines_count ?? 0) <
          (session.limits.max_pipelines ?? Infinity)
        );
      case "persons":
        return (session.usage.persons_count ?? 0) < 20_000;
      default:
        return true;
    }
  }

  return { hasPermission, hasFeature, isWithinLimit, canManageAgents };
}
