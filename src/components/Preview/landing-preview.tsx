"use client";

import { useState } from "react";
import { Areas } from "@/components/Sections/areas";
import { CtaFinal } from "@/components/Sections/cta-final";
import { CustomSection } from "@/components/Sections/custom-section";
import { Dor } from "@/components/Sections/dor";
import { Equipe } from "@/components/Sections/equipe";
import { Etapas } from "@/components/Sections/etapas";
import { FAQ } from "@/components/Sections/faq";
import { Footer } from "@/components/Sections/footer";
import { Hero } from "@/components/Sections/hero";
import { LeadPopup } from "@/components/Sections/lead-popup";
import { PolicyPage } from "@/components/Sections/policy-page";
import { Sobre } from "@/components/Sections/sobre";
import { Solucao } from "@/components/Sections/solucao";
import { CtaConfigContext } from "@/components/ui/cta-config";
import { hexToRgbString } from "@/lib/landing-pages/colors";
import { bodyFontVar, headingFontVar } from "@/lib/landing-pages/fonts";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { themeToCssVars, waLink } from "@/lib/landing-pages/schema";
import { effectiveOrder } from "@/lib/landing-pages/section-order";

/**
 * Renderiza a LP inteira a partir do schema. O wrapper aplica as variáveis CSS
 * do tema (`--color-brand`, etc.), então todas as utilidades `bg-brand`,
 * `text-accent`... re-tematizam ao vivo conforme a logo/cores escolhidas.
 */
export function LandingPreview({
  schema,
  demo = true,
}: {
  schema: LpSchema;
  /** true no editor/preview interno; false na LP publicada */
  demo?: boolean;
}) {
  const accentRgb = hexToRgbString(schema.theme.accent);
  const brandRgb = hexToRgbString(schema.theme.brand);
  const brandDarkRgb = hexToRgbString(schema.theme.brandDark);
  const creamRgb = hexToRgbString(schema.theme.cream);
  const creamDeepRgb = hexToRgbString(schema.theme.creamDeep);
  const [popupOpen, setPopupOpen] = useState(false);
  // Política de privacidade como tela separada (no preview, takeover; no deploy
  // vira /[slug]/politica-de-privacidade).
  const [showPolicy, setShowPolicy] = useState(false);

  // Tipografia escolhida: sobrescreve --font-display (títulos) e --font-body
  // (texto). Sem escolha, mantém o padrão do site (Fraunces / Inter).
  const headingVar = headingFontVar(schema.office.fonts?.heading);
  const bodyVar = bodyFontVar(schema.office.fonts?.body);
  // font-family explícito no wrapper para que o texto herde a fonte escolhida
  // (variável CSS sozinha não re-resolve por herança). Títulos usam as classes
  // .section-title/.font-display, que aplicam --font-display por conta própria.
  const fontStyle: Record<string, string> = {
    fontFamily: "var(--font-body), system-ui, -apple-system, sans-serif",
  };
  if (headingVar) fontStyle["--font-display"] = headingVar;
  if (bodyVar) fontStyle["--font-body"] = bodyVar;
  // Cantos dos cards (rounded-2xl) — "square" (padrão) deixa em 5px; só "rounded"
  // mantém ~1rem.
  if (schema.office.cardRadius !== "rounded") fontStyle["--radius-2xl"] = "5px";

  // Seções não obrigatórias desligadas pela chave (ausente = visível).
  const hidden = schema.layout.hidden ?? {};

  // Config dos botões de CTA: ação (popup/WhatsApp/link) + cantos.
  const btn = schema.office.buttons;
  const action = btn?.action ?? "popup";
  const ctaHref =
    action === "link"
      ? (btn?.link ?? "").trim() || undefined
      : action === "whatsapp" && schema.office.whatsapp
        ? waLink(
          schema.office.whatsapp,
          "Olá, vim pelo site e gostaria de falar com vocês.",
        )
        : undefined;
  const ctaConfig = {
    href: ctaHref,
    square: btn?.radius !== "rounded", // quadrado é o padrão
    onCtaClick: action === "popup" ? () => setPopupOpen(true) : undefined,
  };

  // scroll-mt dá uma folga no topo ao rolar até a seção (o preview rola atrás).
  const anchor = "scroll-mt-2";

  // Ordem das seções do meio (Hero/FAQ/Rodapé são fixos).
  const customSections = schema.customSections ?? [];
  const order = effectiveOrder(schema.layout, customSections);

  // Tom da primeira seção VISÍVEL abaixo do Hero — os mini-cards do Hero
  // centralizado se sobrepõem a ela, e a sombra adapta para não sumir no escuro.
  function toneOfItem(item: string): "light" | "dark" {
    if (item.startsWith("custom:")) {
      const sec = customSections.find((s) => s.id === item.slice(7));
      return sec?.tone ?? "light";
    }
    return (
      schema.layout.tones[item as keyof typeof schema.layout.tones] ?? "light"
    );
  }
  const firstVisible = order.find((it) =>
    it === "areas"
      ? !hidden.areas
      : it === "etapas"
        ? !hidden.etapas
        : it === "ctaFinal"
          ? !hidden.ctaFinal
          : true,
  );
  const belowTone: "light" | "dark" = firstVisible
    ? toneOfItem(firstVisible)
    : !hidden.faq
      ? (schema.layout.tones.faq ?? "light")
      : "light";

  // Renderiza uma seção do meio a partir do seu item de ordem.
  function renderItem(item: string) {
    if (item.startsWith("custom:")) {
      const id = item.slice(7);
      const sec = customSections.find((s) => s.id === id);
      if (!sec) return null;
      return (
        <div key={item} id={`sec-custom-${sec.id}`} className={anchor}>
          <CustomSection section={sec} />
        </div>
      );
    }
    switch (item) {
      case "dor":
        return (
          <div key="dor" id="sec-dor" className={anchor}>
            <Dor
              content={schema.dor}
              variant={schema.layout.dor}
              tone={schema.layout.tones.dor}
              accentRgb={accentRgb}
              brandRgb={brandRgb}
              brandDarkRgb={brandDarkRgb}
              image={schema.office.sectionImages.dor}
            />
          </div>
        );
      case "solucao":
        return (
          <div key="solucao" id="sec-solucao" className={anchor}>
            <Solucao
              content={schema.solucao}
              variant={schema.layout.solucao}
              accentRgb={accentRgb}
              brandRgb={brandRgb}
              brandDarkRgb={brandDarkRgb}
              tone={schema.layout.tones.solucao}
              image={schema.office.sectionImages.solucao}
            />
          </div>
        );
      case "sobre":
        return (
          <div key="sobre" id="sec-sobre" className={anchor}>
            <Sobre
              office={schema.office}
              variant={schema.layout.sobre}
              tone={schema.layout.tones.sobre}
            />
          </div>
        );
      case "equipe":
        return (
          <div key="equipe" id="sec-equipe" className={anchor}>
            <Equipe
              lawyers={schema.office.lawyers}
              brandRgb={brandRgb}
              tone={schema.layout.tones.equipe}
              variant={schema.layout.equipe}
            />
          </div>
        );
      case "areas":
        return hidden.areas ? null : (
          <div key="areas" id="sec-areas" className={anchor}>
            <Areas
              content={schema.areas}
              variant={schema.layout.areas}
              accentRgb={accentRgb}
              tone={schema.layout.tones.areas}
            />
          </div>
        );
      case "etapas":
        return hidden.etapas ? null : (
          <div key="etapas" id="sec-etapas" className={anchor}>
            <Etapas
              content={schema.etapas}
              variant={schema.layout.etapas}
              tone={schema.layout.tones.etapas}
            />
          </div>
        );
      case "ctaFinal":
        return hidden.ctaFinal ? null : (
          <div key="ctaFinal" id="sec-ctaFinal" className={anchor}>
            <CtaFinal
              content={schema.ctaFinal}
              accentRgb={accentRgb}
              tone={schema.layout.tones.ctaFinal}
            />
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <CtaConfigContext.Provider value={ctaConfig}>
      <div
        style={{ ...themeToCssVars(schema.theme), ...fontStyle }}
        className="lp-root bg-white text-ink"
      >
        {showPolicy ? (
          <PolicyPage
            office={schema.office}
            onBack={() => setShowPolicy(false)}
          />
        ) : (
          <>
            <div id="sec-hero" className={anchor}>
              <Hero
                content={schema.hero}
                office={schema.office}
                variant={schema.layout.hero}
                videoId={schema.videoId}
                accentRgb={accentRgb}
                brandRgb={brandRgb}
                brandDarkRgb={brandDarkRgb}
                creamRgb={creamRgb}
                creamDeepRgb={creamDeepRgb}
                tone={schema.layout.tones.hero ?? "light"}
                belowTone={belowTone}
              />
            </div>
            {/* Seções do meio na ordem definida (Hero acima, FAQ/Rodapé abaixo). */}
            {order.map(renderItem)}
            {!hidden.faq ? (
              <div id="sec-faq" className={anchor}>
                <FAQ content={schema.faq} tone={schema.layout.tones.faq} />
              </div>
            ) : null}
            <div id="sec-footer" className={anchor}>
              <Footer
                office={schema.office}
                onPrivacyClick={() => setShowPolicy(true)}
              />
            </div>
            <LeadPopup
              demo={demo}
              open={popupOpen}
              onClose={() => setPopupOpen(false)}
              questions={schema.office.buttons?.popup?.questions ?? []}
              emailConfig={schema.office.buttons?.popup?.email}
            />
          </>
        )}
      </div>
    </CtaConfigContext.Provider>
  );
}
