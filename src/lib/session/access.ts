import type { Session } from "./types";

/** Plano (billing.plans.id) que habilita o gerador de landing pages. */
export const LP_PLAN_ID = 9;

/** App pai (Causi) — link na página de acesso negado. */
export const CAUSI_APP_URL = "https://app.causi.com.br";

/** `true` quando a assinatura ativa do usuário é o plano de Landing Pages. */
export function hasLpAccess(session: Session | null): boolean {
  if (session?.plan?.id !== LP_PLAN_ID) return false;
  const status = session.subscription?.status;
  return status === "active" || status === "trial";
}
