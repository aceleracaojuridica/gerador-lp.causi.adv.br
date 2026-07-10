"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type { ActionResult } from "@/app/actions/lps";
import { ACCESS_DENIED_ERROR, mapLpDbError } from "@/lib/errors";
import {
  createLead,
  deleteLead,
  type LeadLandingPageOption,
  type LeadListFilters,
  type LeadRow,
  listLeads,
} from "@/lib/landing-pages/lead-store";
import { hasLpAccess, requireAuth, requireLpSession } from "@/lib/session";
import { isTurnstileConfigured, verifyTurnstileToken } from "@/lib/turnstile";

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return "Não autenticado.";
    if (err.message === "FORBIDDEN") return ACCESS_DENIED_ERROR;
    const mapped = mapLpDbError(err);
    return mapped.description || err.message;
  }
  return fallback;
}

export type LeadDto = LeadRow;
export type LeadLandingPageDto = LeadLandingPageOption;

export async function listLeadsAction(
  filters: LeadListFilters = {},
): Promise<
  | { ok: true; leads: LeadDto[]; landingPages: LeadLandingPageDto[] }
  | { ok: false; error: string }
> {
  try {
    const session = await requireAuth();
    if (!hasLpAccess(session)) {
      return { ok: true, leads: [], landingPages: [] };
    }
    const result = await listLeads(session, filters);
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao listar contatos.") };
  }
}

export async function deleteLeadAction(leadId: number): Promise<ActionResult> {
  try {
    const session = await requireLpSession();
    await deleteLead(session, leadId);
    revalidatePath("/contatos");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao excluir contato.") };
  }
}

export type SubmitLeadPayload = {
  officeSubdomain: string;
  lpSlug: string;
  nome: string;
  telefone: string;
  answers?: Record<string, string>;
  pageUrl: string;
  captchaToken?: string;
};

/** Captura pública — sem autenticação de usuário. */
export async function submitLeadAction(
  payload: SubmitLeadPayload,
): Promise<{ ok: true; id: number } | { ok: false; error: string }> {
  try {
    if (isTurnstileConfigured()) {
      const token = payload.captchaToken?.trim();
      if (!token) {
        return { ok: false, error: "Confirme o captcha antes de enviar." };
      }
      const headerStore = await headers();
      const forwarded = headerStore.get("x-forwarded-for");
      const remoteIp = forwarded?.split(",")[0]?.trim();
      const valid = await verifyTurnstileToken(token, remoteIp);
      if (!valid) {
        return { ok: false, error: "Captcha inválido. Tente novamente." };
      }
    }

    const id = await createLead(payload);
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao enviar contato.") };
  }
}
