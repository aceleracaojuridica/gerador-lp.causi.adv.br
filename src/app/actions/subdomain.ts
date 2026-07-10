"use server";

import {
  ensureLpAccount,
  getLpAccount,
  isOfficeSubdomainReservedByAccountName,
  isOfficeSubdomainTakenByOtherAccount,
  updateLpAccountOfficeSubdomain,
} from "@/lib/landing-pages/account-store";
import { validateOfficeSubdomainLocal } from "@/lib/landing-pages/subdomain";
import { requireLpSession } from "@/lib/session";

export type AvailabilityResult = {
  available: boolean;
  reason?: "invalid" | "reserved" | "taken";
  normalized?: string;
  message?: string;
};

const TAKEN_MESSAGE = "Este subdomínio já está em uso por outro escritório.";
const RESERVED_MESSAGE =
  "Este subdomínio está reservado por outro escritório do Causi.";

export async function checkSubdomainAvailabilityAction(
  input: string,
): Promise<AvailabilityResult> {
  const session = await requireLpSession();
  const accountId = session.account.id;

  const local = validateOfficeSubdomainLocal(input);
  if (!local.ok) {
    return { available: false, reason: "invalid", message: local.message };
  }

  const normalized = local.normalized;

  const [takenBySubdomain, reservedByName] = await Promise.all([
    isOfficeSubdomainTakenByOtherAccount(normalized, accountId),
    isOfficeSubdomainReservedByAccountName(normalized, accountId),
  ]);

  if (takenBySubdomain) {
    return {
      available: false,
      reason: "taken",
      normalized,
      message: TAKEN_MESSAGE,
    };
  }
  if (reservedByName) {
    return {
      available: false,
      reason: "reserved",
      normalized,
      message: RESERVED_MESSAGE,
    };
  }

  return { available: true, normalized };
}

export type UpdateOfficeSubdomainResult =
  | { ok: true; officeSubdomain: string }
  | { ok: false; error: string };

export async function updateOfficeSubdomainAction(
  input: string,
): Promise<UpdateOfficeSubdomainResult> {
  const session = await requireLpSession();
  if (session.role.accessLevel < 100) {
    return {
      ok: false,
      error: "Somente o owner da conta pode alterar o subdomínio.",
    };
  }

  const availability = await checkSubdomainAvailabilityAction(input);
  if (!availability.available || !availability.normalized) {
    return {
      ok: false,
      error:
        availability.message ??
        (availability.reason === "taken"
          ? TAKEN_MESSAGE
          : availability.reason === "reserved"
            ? RESERVED_MESSAGE
            : "Subdomínio inválido."),
    };
  }

  try {
    await ensureLpAccount(session);
    await updateLpAccountOfficeSubdomain(session, availability.normalized);
    return { ok: true, officeSubdomain: availability.normalized };
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      return {
        ok: false,
        error: "Este subdomínio já foi reservado por outro escritório.",
      };
    }
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar o subdomínio.",
    };
  }
}

export async function getOfficeSubdomainAction(): Promise<string> {
  const session = await requireLpSession();
  await ensureLpAccount(session);
  const account = await getLpAccount(session);
  return account?.office_subdomain ?? "";
}
