"use client";

import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";
import { whatsappLandingPath } from "@/lib/landing-pages/lp-url";
import type { Office } from "@/lib/landing-pages/schema";

/**
 * Botão flutuante de WhatsApp (canto inferior direito). Duas ações:
 * - "whatsapp": vai direto para a página de redirecionamento do WhatsApp.
 * - "popup": abre o formulário de lead; o envio redireciona ao WhatsApp.
 * Em ambos o destino final é sempre o WhatsApp (nunca só o popup).
 */
export function FloatingWhatsAppButton({
  office,
  onOpenPopup,
  demo = false,
}: {
  office: Office;
  onOpenPopup: () => void;
  /** true no preview do editor: o redirecionamento fica inerte (evita 404 no iframe). */
  demo?: boolean;
}) {
  const cfg = office.floatingButton;
  // Ausente nas LPs antigas: mantém o comportamento "sempre presente".
  const enabled = cfg?.enabled ?? true;
  const action = cfg?.action ?? "whatsapp";
  const whatsapp = office.whatsapp?.trim();

  if (!enabled) return null;
  // Ação "WhatsApp" sem número não tem para onde ir.
  if (action === "whatsapp" && !whatsapp) return null;

  // Verde padrão do WhatsApp com o glifo branco (o fill verde do ícone é só um
  // atributo de apresentação, então o CSS [&_path]:fill-white vence).
  const cls =
    "fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#1eb455] hover:shadow-xl sm:bottom-6 sm:right-6";
  const iconCls = "h-8 w-8 [&_path]:fill-white";

  // No preview do editor, o botão é só ilustrativo (não navega).
  if (action === "whatsapp" && whatsapp && !demo) {
    return (
      <a
        href={whatsappLandingPath(whatsapp)}
        aria-label="Falar no WhatsApp"
        className={cls}
      >
        <WhatsAppIcon className={iconCls} />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={action === "popup" ? onOpenPopup : undefined}
      aria-label="Falar no WhatsApp"
      className={cls}
    >
      <WhatsAppIcon className={iconCls} />
    </button>
  );
}
