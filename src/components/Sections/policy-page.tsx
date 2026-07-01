import { ArrowBack } from "@material-symbols-svg/react";
import { defaultPrivacyPolicy } from "@/lib/landing-pages/privacy-policy";
import type { Office } from "@/lib/landing-pages/schema";

/**
 * Página da Política de Privacidade — tela separada (no preview do builder
 * aparece em tela cheia com Voltar; na LP publicada vira /[slug]/politica-de-privacidade).
 */
export function PolicyPage({
  office,
  onBack,
}: {
  office: Office;
  onBack?: () => void;
}) {
  const texto = office.privacyPolicy?.trim() || defaultPrivacyPolicy(office);
  const nome = office.fullName || office.name || "Escritório";
  return (
    <div className="min-h-screen bg-lp-cream">
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-10">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-lp-brand transition hover:opacity-70"
          >
            <ArrowBack size={18} /> Voltar
          </button>
        ) : null}
        <h1 className="font-display text-3xl font-bold text-lp-brand md:text-4xl">
          Política de Privacidade
        </h1>
        <p className="mt-1 text-sm text-lp-ink-soft">{nome}</p>
        <div className="mt-8 whitespace-pre-line text-[1.02rem] leading-relaxed text-lp-ink-soft">
          {texto}
        </div>
      </div>
    </div>
  );
}
