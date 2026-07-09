import { z } from "zod";
import { isReservedSegment } from "@/lib/landing-pages/public-routing";
import { slugFromOfficeName } from "@/lib/landing-pages/slug";

export const OFFICE_SUBDOMAIN_MIN_LENGTH = 3;
export const OFFICE_SUBDOMAIN_MAX_LENGTH = 63;
export const OFFICE_SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

export function normalizeOfficeSubdomainInput(value: string): string {
  return slugFromOfficeName(value);
}

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
