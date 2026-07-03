"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SectionVariantControls } from "@/components/builder/shared/section-variant-carousel";
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
import { cn } from "@/lib/utils";

export type PreviewEditableSectionId =
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "equipe"
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "footer";

export type PreviewVariantControl = {
  label: string;
  options: Array<{
    id: string;
    label: string;
    thumb?: ReactNode;
  }>;
  value: string;
  onChange: (id: string) => void;
};

type PreviewEditorConfig = {
  selectedSection?: PreviewEditableSectionId;
  onSectionSelect?: (sectionId: PreviewEditableSectionId) => void;
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
}: {
  schema: LpSchema;
  /** true no editor/preview interno; false na LP publicada */
  demo?: boolean;
  editor?: PreviewEditorConfig;
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

  function renderEditableFrame(
    sectionId: PreviewEditableSectionId,
    anchorId: string,
    label: string,
    children: ReactNode,
  ) {
    if (!editor) {
      return (
        <div id={anchorId} className={anchor}>
          {children}
        </div>
      );
    }

    const selected = editor.selectedSection === sectionId;
    const control = editor.variantControls?.[sectionId];
    const variantLabels = control
      ? Object.fromEntries(
          control.options.map((option) => [option.id, option.label]),
        )
      : {};

    return (
      <div id={anchorId} className={cn(anchor, "group/section relative")}>
        {children}
        <div
          className={cn(
            "pointer-events-none absolute inset-2 rounded-[28px] ring-1 transition",
            selected
              ? "ring-primary shadow-lg shadow-slate-900/10"
              : "ring-black/5 group-hover/section:ring-primary/20",
          )}
        />
        <div className="absolute left-4 top-4 z-20">
          <button
            type="button"
            onClick={() => editor.onSectionSelect?.(sectionId)}
            className={cn(
              "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur transition",
              selected
                ? "border-primary/30 bg-primary text-primary-foreground"
                : "border-white/80 bg-white/90 text-slate-700 hover:border-primary/20 hover:text-primary",
            )}
          >
            <span>{label}</span>
            <span className="opacity-70">
              {selected ? "Editando" : "Selecionar"}
            </span>
          </button>
        </div>
        {control ? (
          <div className="absolute right-4 top-4 z-20 w-[min(320px,calc(100%-2rem))]">
            <SectionVariantControls
              label={control.label}
              variants={control.options.map((option) => option.id)}
              variantLabels={variantLabels}
              current={control.value}
              onChange={control.onChange}
              className="border-white/80 bg-white/92 shadow-lg backdrop-blur"
            />
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
          <div key="dor">
            {renderEditableFrame(
              "dor",
              "sec-dor",
              "Dores",
              <Dor
                content={schema.dor}
                variant={schema.layout.dor}
                tone={schema.layout.tones.dor}
                accentRgb={accentRgb}
                brandRgb={brandRgb}
                brandDarkRgb={brandDarkRgb}
                image={schema.office.sectionImages.dor}
              />,
            )}
          </div>
        );
      case "solucao":
        return (
          <div key="solucao">
            {renderEditableFrame(
              "solucao",
              "sec-solucao",
              "Solução",
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
            {renderEditableFrame(
              "sobre",
              "sec-sobre",
              "Sobre",
              <Sobre
                office={schema.office}
                variant={schema.layout.sobre}
                tone={schema.layout.tones.sobre}
              />,
            )}
          </div>
        );
      case "equipe":
        return hidden.equipe ? null : (
          <div key="equipe">
            {renderEditableFrame(
              "equipe",
              "sec-equipe",
              "Equipe",
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
            {renderEditableFrame(
              "areas",
              "sec-areas",
              "Áreas",
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
            {renderEditableFrame(
              "etapas",
              "sec-etapas",
              "Etapas",
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
            {renderEditableFrame(
              "ctaFinal",
              "sec-ctaFinal",
              "CTA final",
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
            {renderEditableFrame(
              "hero",
              "sec-hero",
              "Topo",
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
              />,
            )}
            {/* Seções do meio na ordem definida (Hero acima, FAQ/Rodapé abaixo). */}
            {order.map(renderItem)}
            {!hidden.faq
              ? renderEditableFrame(
                  "faq",
                  "sec-faq",
                  "FAQ",
                  <FAQ content={schema.faq} tone={schema.layout.tones.faq} />,
                )
              : null}
            {renderEditableFrame(
              "footer",
              "sec-footer",
              "Rodapé",
              <Footer
                office={schema.office}
                onPrivacyClick={() => setShowPolicy(true)}
              />,
            )}
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
