"use client";

import { Call } from "@material-symbols-svg/react";
import { useCtaConfig } from "@/components/ui/cta-config";
import { waLink } from "@/lib/landing-pages/schema";

const WA_MESSAGE = "Olá, vim pelo site e gostaria de tirar uma dúvida.";

/**
 * Telefone do rodapé. Quando a página está configurada para "popup", abre o
 * formulário de lead (que depois redireciona ao WhatsApp); senão vai direto
 * para o WhatsApp. Usa o mesmo CtaConfig dos botões de CTA.
 */
export function FooterPhoneLink({
  whatsapp,
  display,
}: {
  whatsapp: string;
  display: string;
}) {
  const { onCtaClick } = useCtaConfig();
  const cls =
    "flex w-fit items-center gap-2 text-left transition hover:text-lp-accent-soft";
  const inner = (
    <>
      <Call size={16} className="shrink-0" />
      {display}
    </>
  );

  if (onCtaClick) {
    return (
      <button type="button" onClick={onCtaClick} className={cls}>
        {inner}
      </button>
    );
  }
  return (
    <a
      href={waLink(whatsapp, WA_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      className={cls}
    >
      {inner}
    </a>
  );
}
