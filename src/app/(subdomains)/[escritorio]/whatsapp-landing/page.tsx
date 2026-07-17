import type { Metadata } from "next";
import { WhatsAppRedirect } from "./whatsapp-redirect";

export const metadata: Metadata = {
  title: "Abrindo o WhatsApp…",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ whatsapp?: string }>;
};

/**
 * `{subdominio}.causi.adv.br/whatsapp-landing/?whatsapp=NUMERO`
 * Página de carregamento (5s) antes de redirecionar ao WhatsApp — dá tempo dos
 * scripts de conversão dispararem. Só aceita dígitos.
 */
export default async function WhatsAppLandingPage({ searchParams }: Props) {
  const { whatsapp } = await searchParams;
  const digits = (whatsapp ?? "").replace(/\D/g, "");
  return <WhatsAppRedirect whatsapp={digits} />;
}
