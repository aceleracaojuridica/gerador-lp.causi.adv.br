import type { z } from "zod";

export const LP_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const WHATSAPP_DIGITS_LENGTH = 13;

/** Valida WhatsApp brasileiro (13 dígitos: 55 + DDD + 9 dígitos). */
export function refineRequiredWhatsapp(
  ctx: z.RefinementCtx,
  whatsapp: string,
  path: (string | number)[],
  options?: { emptyMessage?: string; invalidMessage?: string },
) {
  if (whatsapp.length !== WHATSAPP_DIGITS_LENGTH) {
    ctx.addIssue({
      code: "custom",
      path,
      message:
        whatsapp.length === 0
          ? (options?.emptyMessage ?? "WhatsApp é obrigatório")
          : (options?.invalidMessage ?? "Informe DDD + 9 dígitos"),
    });
  }
}

/** Valida e-mail obrigatório com formato básico. */
export function refineRequiredEmail(
  ctx: z.RefinementCtx,
  email: string,
  path: (string | number)[],
  options?: { emptyMessage?: string; invalidMessage?: string },
) {
  const trimmed = email.trim();
  if (!trimmed) {
    ctx.addIssue({
      code: "custom",
      path,
      message: options?.emptyMessage ?? "E-mail é obrigatório",
    });
  } else if (!LP_EMAIL_REGEX.test(trimmed)) {
    ctx.addIssue({
      code: "custom",
      path,
      message: options?.invalidMessage ?? "E-mail inválido",
    });
  }
}
