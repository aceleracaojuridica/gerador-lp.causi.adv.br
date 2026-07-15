"use client";

import { createContext, use } from "react";

/** Abre a política de privacidade (takeover) no chrome da LP. */
export const LpPrivacyOpenContext = createContext<(() => void) | null>(null);

/**
 * Link/botão de política no footer.
 * Com provider do chrome público → takeover; senão → âncora relativa.
 */
export function FooterPrivacyTrigger() {
  const onOpen = use(LpPrivacyOpenContext);

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-white/70 underline-offset-2 transition hover:text-white hover:underline"
      >
        Política de Privacidade
      </button>
    );
  }

  return (
    <a
      href="politica-de-privacidade"
      className="text-white/70 underline-offset-2 transition hover:text-white hover:underline"
    >
      Política de Privacidade
    </a>
  );
}
