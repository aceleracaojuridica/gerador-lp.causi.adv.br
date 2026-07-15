import { z } from "zod";
import { isReservedSegment } from "@/lib/landing-pages/public-routing";
import { slugFromOfficeName } from "@/lib/landing-pages/slug";

export const OFFICE_SUBDOMAIN_MIN_LENGTH = 3;
export const OFFICE_SUBDOMAIN_MAX_LENGTH = 63;
export const OFFICE_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export function normalizeOfficeSubdomainInput(value: string): string {
  return slugFromOfficeName(value);
}

/**
 * Formata o subdomínio enquanto o usuário digita: remove acentos, minúsculas,
 * espaços viram hífen e caracteres inválidos são removidos.
 * Mantém hífen final para feedback imediato ao pressionar espaço.
 */
export function formatOfficeSubdomainDraft(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

/** Bloqueia nomes de `RESERVED_SEGMENTS` — só se aplica a subdomínio, não a slug de LP. */
export function isReservedOfficeSubdomain(value: string): boolean {
  return isReservedSegment(value);
}

export const officeSubdomainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(
    OFFICE_SUBDOMAIN_MIN_LENGTH,
    `Use no mínimo ${OFFICE_SUBDOMAIN_MIN_LENGTH} caracteres.`,
  )
  .max(
    OFFICE_SUBDOMAIN_MAX_LENGTH,
    `Use no máximo ${OFFICE_SUBDOMAIN_MAX_LENGTH} caracteres.`,
  )
  .refine(
    (value) => value === normalizeOfficeSubdomainInput(value),
    "Use apenas letras minúsculas, números e hífen.",
  )
  .refine(
    (value) => OFFICE_SUBDOMAIN_PATTERN.test(value),
    "Formato inválido para subdomínio.",
  )
  .refine((value) => !value.includes("--"), "Não use hífen duplo consecutivo.")
  .refine(
    (value) => !value.startsWith("acct-"),
    "Este prefixo é reservado pelo sistema.",
  )
  .refine(
    (value) => !isReservedOfficeSubdomain(value),
    "Este subdomínio é reservado pelo sistema.",
  );

export function parseOfficeSubdomain(value: string): string {
  return officeSubdomainSchema.parse(value);
}

export type OfficeSubdomainLocalValidation =
  | { ok: true; normalized: string }
  | { ok: false; message: string };

/** Validação local de formato e reservados — sem consulta remota. */
export function validateOfficeSubdomainLocal(
  value: string,
): OfficeSubdomainLocalValidation {
  const normalized = normalizeOfficeSubdomainInput(value);
  const result = officeSubdomainSchema.safeParse(normalized);
  if (result.success) {
    return { ok: true, normalized: result.data };
  }
  return {
    ok: false,
    message: result.error.issues[0]?.message ?? "Subdomínio inválido.",
  };
}
