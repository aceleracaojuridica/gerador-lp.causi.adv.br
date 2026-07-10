import type { Session } from "./types";

/** Plano (billing.plans.id) que habilita o gerador de landing pages. */
export const LP_PLAN_ID = 9;

/** App pai (Causi) — link na página de acesso negado. */
export const CAUSI_APP_URL = "https://app.causi.com.br";

const UPGRADE_PLAN_SLUGS = new Set(["essential", "classroom_premium"]);

/** Assinatura em vigor para uso do gerador (active ou trial). */
export function isSubscriptionActive(session: Session | null): boolean {
  const status = session?.subscription?.status;
  return status === "active" || status === "trial";
}

/**
 * `true` quando a assinatura ativa/trial inclui escrita no gerador:
 * plano dedicado (ID 9) ou feature `landing_pages` no plano.
 */
export function hasLpAccess(session: Session | null): boolean {
  if (!session || !isSubscriptionActive(session)) return false;
  if (session.plan?.id === LP_PLAN_ID) return true;
  return session.features.landing_pages === true;
}

/** Mensagem de upgrade contextual ao plano do usuário. */
export function getLpUpgradeMessage(session: Session | null): string {
  const slug = session?.plan?.slug;
  if (slug && UPGRADE_PLAN_SLUGS.has(slug)) {
    return "Você precisa de um plano maior para criar ou editar landing pages.";
  }
  return "Seu plano atual não inclui landing pages. Faça upgrade no painel do Causi.";
}
