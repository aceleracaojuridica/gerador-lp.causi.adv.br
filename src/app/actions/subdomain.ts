"use server";

import {
  ensureLpAccount,
  getLpAccount,
  isOfficeSubdomainReservedByAccountName,
  isOfficeSubdomainTakenByOtherAccount,
  updateLpAccountOfficeSubdomain,
} from "@/lib/landing-pages/account-store";
import { parseOfficeSubdomain } from "@/lib/landing-pages/subdomain";
import { requireLpSession } from "@/lib/session";

type AvailabilityResult = {
  available: boolean;
  reason?: "invalid" | "reserved" | "taken";
  normalized?: string;
};

export async function checkSubdomainAvailabilityAction(
  input: string,
): Promise<AvailabilityResult> {
  const session = await requireLpSession();
  const accountId = session.account.id;

  let normalized: string;
  try {
    normalized = parseOfficeSubdomain(input);
  } catch {
    return { available: false, reason: "invalid" };
  }

  const [takenBySubdomain, reservedByName] = await Promise.all([
    isOfficeSubdomainTakenByOtherAccount(normalized, accountId),
    isOfficeSubdomainReservedByAccountName(normalized, accountId),
  ]);

  if (takenBySubdomain) {
    return { available: false, reason: "taken", normalized };
  }
  if (reservedByName) {
    return { available: false, reason: "reserved", normalized };
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
    const message =
      availability.reason === "taken"
        ? "Este subdomínio já está em uso por outro escritório."
        : availability.reason === "reserved"
          ? "Este subdomínio está reservado por outro escritório do Causi."
          : "Subdomínio inválido.";
    return { ok: false, error: message };
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
