"use client";

import { createContext, useContext } from "react";

// Configuração global dos botões de CTA da LP, fornecida pela LandingPreview e
// consumida pelo CTAButton (evita passar props por todas as seções).
export type CtaConfig = {
  href?: string; // destino (WhatsApp ou link); ausente = botão sem ação
  square: boolean; // cantos quadrados (5px) em vez de pílula
  onCtaClick?: () => void; // ação "popup": abre o popup de lead
};

export const CtaConfigContext = createContext<CtaConfig>({ square: false });

export const useCtaConfig = () => useContext(CtaConfigContext);
