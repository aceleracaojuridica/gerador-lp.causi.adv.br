import type { Session } from "@/lib/session/types";

/** Número de suporte (somente dígitos) via `NEXT_PUBLIC_SUPPORT_WHATSAPP`. */
export function getSupportWhatsAppDigits(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP?.replace(/\D/g, "") ?? "";
}

/** Monta o texto padrão enviado ao WhatsApp de suporte. */
export function buildSupportMessage(
  session: Session,
  subject: string,
  message: string,
): string {
  return [
    `> Nome: ${session.user.name}`,
    `> E-mail: ${session.user.email}`,
    `> Escritório: ${session.account.name}`,
    `> Assunto: ${subject.trim()}`,
    "",
    message.trim(),
  ].join("\n");
}

/** Link wa.me com mensagem pré-preenchida; `null` se o número não estiver configurado. */
export function buildSupportWhatsAppUrl(
  session: Session,
  subject: string,
  message: string,
): string | null {
  const digits = getSupportWhatsAppDigits();
  if (!digits) return null;

  const text = buildSupportMessage(session, subject, message);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
