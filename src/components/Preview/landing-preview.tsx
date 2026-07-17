"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SectionVariantControls } from "@/components/Builder/shared/section-variant-controls";
import { Areas } from "@/components/Sections/areas";
import { CtaFinal } from "@/components/Sections/cta-final";
import { CustomSection } from "@/components/Sections/custom-section";
import { Dor } from "@/components/Sections/dor";
import { Equipe } from "@/components/Sections/equipe";
import { Etapas } from "@/components/Sections/etapas";
import { FAQ } from "@/components/Sections/faq";
import { FloatingWhatsAppButton } from "@/components/Sections/floating-whatsapp-button";
import { Footer } from "@/components/Sections/footer";
import { Hero } from "@/components/Sections/hero";
import {
  type LeadCaptureContext,
  LeadPopup,
} from "@/components/Sections/lead-popup";
import { PolicyPage } from "@/components/Sections/policy-page";
import { Sobre } from "@/components/Sections/sobre";
import { Solucao } from "@/components/Sections/solucao";
import { CtaConfigContext } from "@/components/ui/cta-config";
import { hexToRgbString } from "@/lib/landing-pages/colors";
import { bodyFontVar, headingFontVar } from "@/lib/landing-pages/fonts";
import { whatsappLandingPath } from "@/lib/landing-pages/lp-url";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { themeToCssVars } from "@/lib/landing-pages/schema";
import { effectiveOrder } from "@/lib/landing-pages/section-order";
import { cn } from "@/lib/utils";

export type PreviewEditableSectionId =
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "equipe"
  | "areas"
  | "etapas";

export type PreviewVariantControl = {
  label: string;
  options: ReadonlyArray<{ id: string; label: string }>;
  value: string;
  onChange: (id: string) => void;
};

type PreviewEditorConfig = {
  variantControls?: Partial<
    Record<PreviewEditableSectionId, PreviewVariantControl | undefined>
  >;
};

/**
 * Renderiza a LP inteira a partir do schema. O wrapper aplica as variáveis CSS
 * do tema (`--color-lp-brand`, etc.), então todas as utilidades `bg-lp-brand`,
 * `text-lp-accent`... re-tematizam ao vivo conforme a logo/cores escolhidas.
 */
export function LandingPreview({
  schema,
  demo = true,
  editor,
  leadContext,
}: {
  schema: LpSchema;
  /** true no editor/preview interno; false na LP publicada */
  demo?: boolean;
  /** Habilita os seletores de variante flutuantes sobre cada seção (editor). */
  editor?: PreviewEditorConfig;
  /** Contexto para captura de lead na LP publicada. */
  leadContext?: LeadCaptureContext;
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
  // Cantos dos cards — "square" (padrão) achata em 5px; "rounded" mantém a escala.
  // Precisa cobrir TODAS as escalas usadas por card/painel, não só a 2xl:
  //   xl  → cards de Dor, Solução, Áreas e itens do FAQ
  //   2xl → mini-cards do Hero, Sobre, Equipe, seções custom e embeds
  //   3xl → painel da Etapas
  if (schema.office.cardRadius !== "rounded") {
    // ATENÇÃO: o globals.css declara a escala de raio dentro de `@theme inline`,
    // então o Tailwind EMBUTE o valor na classe: `.rounded-2xl` vira
    // `border-radius: calc(var(--radius) * 1.8)`. Ela não referencia
    // `--radius-2xl` — sobrescrever essa var não tem efeito nenhum.
    // Quem manda é a base `--radius`; achatá-la deixa toda a escala quadrada
    // (rounded-lg/xl/2xl/3xl) de uma vez. `rounded-full` não é afetado.
    fontStyle["--radius"] = "3px";
    // Recorte diagonal das imagens (Hero, Dor, Solução, Sobre, Equipe): var
    // própria, fora do @theme, por isso resolve em runtime normalmente.
    fontStyle["--lp-corner"] = "5px";
    fontStyle["--lp-corner-sm"] = "5px";
  }

  // Seções não obrigatórias desligadas pela chave (ausente = visível).
  const hidden = schema.layout.hidden ?? {};

  // Config dos botões de CTA: ação (popup/WhatsApp/link) + cantos.
  const btn = schema.office.buttons;
  const action = btn?.action ?? "popup";
  const ctaHref =
    action === "link"
      ? (btn?.link ?? "").trim() || undefined
      : // No preview (demo) o link do WhatsApp fica inerte: `/whatsapp-landing`
        // não existe no domínio da app e abriria um 404 dentro do iframe.
        action === "whatsapp" && schema.office.whatsapp && !demo
        ? whatsappLandingPath(schema.office.whatsapp)
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

  // 2º botão do Hero: âncora interna. Vai para "Áreas de atuação" quando ativa;
  // senão cai no "Sobre" (seção obrigatória, sempre presente).
  const heroAnchorCta =
    !hidden.areas && order.includes("areas")
      ? { label: "Áreas de atuação", href: "#sec-areas" }
      : { label: "Sobre o escritório", href: "#sec-sobre" };

  function renderSectionFrame(
    sectionId: PreviewEditableSectionId | null,
    anchorId: string,
    children: ReactNode,
  ) {
    const control = sectionId
      ? editor?.variantControls?.[sectionId]
      : undefined;
    return (
      <div
        id={anchorId}
        className={cn(anchor, control ? "relative" : undefined)}
      >
        {children}
        {control ? (
          <div className="pointer-events-none absolute inset-y-0 right-3 z-20">
            <div className="sticky top-3 pointer-events-auto">
              <SectionVariantControls
                label={control.label}
                variants={control.options.map((option) => option.id)}
                current={control.value}
                onChange={control.onChange}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  // Renderiza uma seção do meio a partir do seu item de ordem.
  function renderItem(item: string) {
    if (item.startsWith("custom:")) {
      const id = item.slice(7);
      const sec = customSections.find((s) => s.id === id);
      if (!sec || sec.hidden) return null;
      return (
        <div key={item} id={`sec-custom-${sec.id}`} className={anchor}>
          <CustomSection section={sec} demo={demo} />
        </div>
      );
    }
    switch (item) {
      case "dor":
        return (
          <div key="dor">
            {renderSectionFrame(
              "dor",
              "sec-dor",
              <Dor
                content={schema.dor}
                variant={schema.layout.dor}
                tone={schema.layout.tones.dor}
                accentRgb={accentRgb}
                brandRgb={brandRgb}
                brandDarkRgb={brandDarkRgb}
                image={schema.office.sectionImages?.dor}
              />,
            )}
          </div>
        );
      case "solucao":
        return (
          <div key="solucao">
            {renderSectionFrame(
              "solucao",
              "sec-solucao",
              <Solucao
                content={schema.solucao}
                variant={schema.layout.solucao}
                accentRgb={accentRgb}
                brandRgb={brandRgb}
                brandDarkRgb={brandDarkRgb}
                tone={schema.layout.tones.solucao}
                image={schema.office.sectionImages.solucao}
              />,
            )}
          </div>
        );
      case "sobre":
        return (
          <div key="sobre">
            {renderSectionFrame(
              "sobre",
              "sec-sobre",
              <Sobre
                office={schema.office}
                variant={schema.layout.sobre}
                tone={schema.layout.tones.sobre}
                content={schema.sobre}
              />,
            )}
          </div>
        );
      case "equipe":
        return hidden.equipe ? null : (
          <div key="equipe">
            {renderSectionFrame(
              "equipe",
              "sec-equipe",
              <Equipe
                lawyers={schema.office.lawyers}
                brandRgb={brandRgb}
                tone={schema.layout.tones.equipe}
                variant={schema.layout.equipe}
              />,
            )}
          </div>
        );
      case "areas":
        return hidden.areas ? null : (
          <div key="areas">
            {renderSectionFrame(
              "areas",
              "sec-areas",
              <Areas
                content={schema.areas}
                variant={schema.layout.areas}
                accentRgb={accentRgb}
                tone={schema.layout.tones.areas}
              />,
            )}
          </div>
        );
      case "etapas":
        return hidden.etapas ? null : (
          <div key="etapas">
            {renderSectionFrame(
              "etapas",
              "sec-etapas",
              <Etapas
                content={schema.etapas}
                variant={schema.layout.etapas}
                tone={schema.layout.tones.etapas}
              />,
            )}
          </div>
        );
      case "ctaFinal":
        return hidden.ctaFinal ? null : (
          <div key="ctaFinal">
            {renderSectionFrame(
              null,
              "sec-ctaFinal",
              <CtaFinal
                content={schema.ctaFinal}
                accentRgb={accentRgb}
                tone={schema.layout.tones.ctaFinal}
              />,
            )}
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
        className="lp-root bg-white text-lp-ink"
      >
        {showPolicy ? (
          <PolicyPage
            office={schema.office}
            onBack={() => setShowPolicy(false)}
          />
        ) : (
          <>
            {renderSectionFrame(
              "hero",
              "sec-hero",
              <Hero
                content={schema.hero}
                office={schema.office}
                variant={schema.layout.hero}
                accentRgb={accentRgb}
                brandRgb={brandRgb}
                brandDarkRgb={brandDarkRgb}
                creamRgb={creamRgb}
                creamDeepRgb={creamDeepRgb}
                tone={schema.layout.tones.hero ?? "light"}
                anchorCta={heroAnchorCta}
              />,
            )}
            {/* Seções do meio na ordem definida (Hero acima, FAQ/Rodapé abaixo). */}
            {order.map(renderItem)}
            {!hidden.faq
              ? renderSectionFrame(
                  null,
                  "sec-faq",
                  <FAQ content={schema.faq} tone={schema.layout.tones.faq} />,
                )
              : null}
            {renderSectionFrame(
              null,
              "sec-footer",
              <Footer
                office={schema.office}
                onPrivacyClick={() => setShowPolicy(true)}
              />,
            )}
            <FloatingWhatsAppButton
              office={schema.office}
              onOpenPopup={() => setPopupOpen(true)}
              demo={demo}
            />
            <LeadPopup
              demo={demo}
              open={popupOpen}
              onClose={() => setPopupOpen(false)}
              questions={schema.office.buttons?.popup?.questions ?? []}
              leadContext={leadContext}
              whatsapp={schema.office.whatsapp}
            />
          </>
        )}
      </div>
    </CtaConfigContext.Provider>
  );
}
