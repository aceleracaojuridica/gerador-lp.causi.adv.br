"use client";

import {
  ArrowForward,
  DesktopWindows,
  Devices,
  ProgressActivity,
  Tablet,
  Tune,
  Visibility,
} from "@material-symbols-svg/react";
import { useState } from "react";
import {
  DevicePreview,
  type Viewport,
} from "@/components/Preview/device-preview";
import { Areas } from "@/components/Sections/areas";
import { CtaFinal } from "@/components/Sections/cta-final";
import { Dor } from "@/components/Sections/dor";
import { Etapas } from "@/components/Sections/etapas";
import { FAQ } from "@/components/Sections/faq";
import { Hero } from "@/components/Sections/hero";
import { Sobre } from "@/components/Sections/sobre";
import { Solucao } from "@/components/Sections/solucao";
import { Button } from "@/components/ui/button";
import { useIsLgUp } from "@/hooks/use-media-query";
import { hexToRgbString } from "@/lib/landing-pages/colors";
import {
  AREAS_CTA_FALLBACK,
  CTA_PRIMARY,
  CTA_SECONDARY,
  type FocoCopy,
  GENERIC_ETAPAS,
} from "@/lib/landing-pages/focos";
import type {
  AreasContent,
  AreasVariant,
  DorVariant,
  EtapasVariant,
  HeroContent,
  HeroVariant,
  Layout,
  Office,
  SobreVariant,
  SolucaoVariant,
  Theme,
} from "@/lib/landing-pages/schema";
import { themeToCssVars } from "@/lib/landing-pages/schema";
import { cn } from "@/lib/utils";
import { PalettePicker } from "./palette-picker";
import { SectionVariantControls } from "./section-variant-carousel";

const HERO_LABELS: Record<string, string> = {
  centered: "Centralizado",
  split: "Dividido",
  video: "Vídeo",
  stats: "Com métricas",
};
const DOR_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
};
const SOLUCAO_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
  destaque: "Cards em destaque",
};
const SOBRE_LABELS: Record<string, string> = {
  overlay: "Overlay escuro",
  duasColunas: "Duas colunas",
  fotoLista: "Foto e lista",
};
const AREAS_LABELS: Record<string, string> = {
  grid: "Grade",
  lista: "Lista",
};
const ETAPAS_LABELS: Record<string, string> = {
  numerado: "Numerado",
  timeline: "Linha do tempo",
};

type SectionId =
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal";

type SectionMeta = {
  id: SectionId;
  label: string;
  variants?: readonly string[];
  variantLabels?: Record<string, string>;
};

type Props = {
  office: Office;
  copy: FocoCopy;
  videoId: string;
  layout: Layout;
  onLayoutChange: (l: Layout) => void;
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onConfirm: () => void;
  gerando: boolean;
};

/**
 * Step final do wizard: painel lateral com controles + preview grande da seção
 * ativa (DevicePreview), no mesmo espírito do editor.
 */
export function LayoutPickerStep({
  office,
  copy,
  videoId,
  layout,
  onLayoutChange,
  theme,
  onThemeChange,
  onConfirm,
  gerando,
}: Props) {
  const isLgUp = useIsLgUp();
  const [mobileTab, setMobileTab] = useState<"sections" | "preview">("preview");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [activeSection, setActiveSection] = useState<SectionId>("hero");
  const showSectionsPanel = isLgUp || mobileTab === "sections";
  const showPreviewPanel = isLgUp || mobileTab === "preview";

  const accentRgb = hexToRgbString(theme.accent);
  const brandRgb = hexToRgbString(theme.brand);
  const brandDarkRgb = hexToRgbString(theme.brandDark);
  const creamRgb = hexToRgbString(theme.cream);
  const creamDeepRgb = hexToRgbString(theme.creamDeep);

  const heroContent: HeroContent = {
    ...copy.hero,
    ctaPrimary: copy.hero.ctaPrimary ?? CTA_PRIMARY,
    ctaSecondary: copy.hero.ctaSecondary ?? CTA_SECONDARY,
  };

  const areasContent: AreasContent = {
    ...copy.areas,
    cta: copy.areas.cta ?? AREAS_CTA_FALLBACK,
  };

  const etapasContent = copy.etapas ?? GENERIC_ETAPAS;

  const heroVariants: HeroVariant[] = videoId
    ? ["video", "centered", "split", "stats"]
    : ["centered", "split", "stats"];

  const sections: SectionMeta[] = [
    {
      id: "hero",
      label: "Hero",
      variants: heroVariants,
      variantLabels: HERO_LABELS,
    },
    {
      id: "dor",
      label: "Problema",
      variants: ["comImagem", "soCards"] satisfies DorVariant[],
      variantLabels: DOR_LABELS,
    },
    {
      id: "solucao",
      label: "Solução",
      variants: ["comImagem", "soCards", "destaque"] satisfies SolucaoVariant[],
      variantLabels: SOLUCAO_LABELS,
    },
    {
      id: "sobre",
      label: "Sobre o escritório",
      variants: [
        "fotoLista",
        "duasColunas",
        "overlay",
      ] satisfies SobreVariant[],
      variantLabels: SOBRE_LABELS,
    },
    {
      id: "areas",
      label: "Áreas de atuação",
      variants: ["grid", "lista"] satisfies AreasVariant[],
      variantLabels: AREAS_LABELS,
    },
    {
      id: "etapas",
      label: "Como funciona",
      variants: ["numerado", "timeline"] satisfies EtapasVariant[],
      variantLabels: ETAPAS_LABELS,
    },
    { id: "faq", label: "FAQ" },
    { id: "ctaFinal", label: "CTA Final" },
  ];

  const activeMeta =
    sections.find((s) => s.id === activeSection) ?? sections[0];

  function currentVariant(id: SectionId): string {
    switch (id) {
      case "hero":
        return layout.hero;
      case "dor":
        return layout.dor;
      case "solucao":
        return layout.solucao;
      case "sobre":
        return layout.sobre;
      case "areas":
        return layout.areas;
      case "etapas":
        return layout.etapas;
      default:
        return "";
    }
  }

  function setVariant(id: SectionId, v: string) {
    switch (id) {
      case "hero":
        onLayoutChange({ ...layout, hero: v as HeroVariant });
        break;
      case "dor":
        onLayoutChange({ ...layout, dor: v as DorVariant });
        break;
      case "solucao":
        onLayoutChange({ ...layout, solucao: v as SolucaoVariant });
        break;
      case "sobre":
        onLayoutChange({ ...layout, sobre: v as SobreVariant });
        break;
      case "areas":
        onLayoutChange({ ...layout, areas: v as AreasVariant });
        break;
      case "etapas":
        onLayoutChange({ ...layout, etapas: v as EtapasVariant });
        break;
    }
  }

  function renderSectionPreview(id: SectionId) {
    switch (id) {
      case "hero":
        return (
          <Hero
            content={heroContent}
            office={office}
            variant={layout.hero}
            videoId={videoId || undefined}
            accentRgb={accentRgb}
            brandRgb={brandRgb}
            brandDarkRgb={brandDarkRgb}
            creamRgb={creamRgb}
            creamDeepRgb={creamDeepRgb}
            tone={layout.tones.hero}
            belowTone={layout.tones.dor}
          />
        );
      case "dor":
        return (
          <Dor
            content={copy.dor}
            variant={layout.dor}
            tone={layout.tones.dor}
            accentRgb={accentRgb}
            brandRgb={brandRgb}
            brandDarkRgb={brandDarkRgb}
            image={office.sectionImages.dor}
          />
        );
      case "solucao":
        return (
          <Solucao
            content={copy.solucao}
            variant={layout.solucao}
            tone={layout.tones.solucao}
            accentRgb={accentRgb}
            brandRgb={brandRgb}
            brandDarkRgb={brandDarkRgb}
            image={office.sectionImages.solucao}
          />
        );
      case "sobre":
        return (
          <Sobre
            office={office}
            variant={layout.sobre}
            tone={layout.tones.sobre}
          />
        );
      case "areas":
        return (
          <Areas
            content={areasContent}
            variant={layout.areas}
            accentRgb={accentRgb}
            tone={layout.tones.areas}
          />
        );
      case "etapas":
        return (
          <Etapas
            content={etapasContent}
            variant={layout.etapas}
            tone={layout.tones.etapas}
          />
        );
      case "faq":
        return <FAQ content={copy.faq} tone={layout.tones.faq} />;
      case "ctaFinal":
        return (
          <CtaFinal
            content={copy.ctaFinal}
            accentRgb={accentRgb}
            tone={layout.tones.ctaFinal}
          />
        );
    }
  }

  const sectionNav = (
    <>
      {/* Mobile: scroll horizontal */}
      <nav className="flex gap-1 overflow-x-auto px-2 py-2 lg:hidden">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-left text-xs font-medium transition",
              activeSection === s.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* Desktop: lista vertical */}
      <nav className="hidden flex-1 space-y-0.5 overflow-y-auto px-2 py-2 lg:block">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition",
              activeSection === s.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            {s.label}
            {s.variants && s.variants.length > 1 ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                —{" "}
                {s.variantLabels?.[currentVariant(s.id)] ??
                  currentVariant(s.id)}
              </span>
            ) : s.id === "faq" || s.id === "ctaFinal" ? (
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                — fixo
              </span>
            ) : null}
          </button>
        ))}
      </nav>
    </>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden lg:flex-row">
      {/* Painel de controles */}
      <aside
        className={cn(
          "flex w-full shrink-0 flex-col border-border bg-card lg:w-[22rem] lg:border-r",
          showSectionsPanel
            ? "min-h-0 flex-1 border-b lg:flex-none lg:border-b-0"
            : "hidden",
        )}
      >
        <div className="border-b border-border px-4 py-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Escolha a variante de cada seção. Os textos podem ser editados
            depois no editor.
          </p>
          <PalettePicker value={theme} onPick={onThemeChange} />
        </div>

        {sectionNav}

        {activeMeta.variants && activeMeta.variantLabels ? (
          <div className="border-t border-border px-4 py-3">
            <SectionVariantControls
              label={activeMeta.label}
              variants={activeMeta.variants}
              variantLabels={activeMeta.variantLabels}
              current={currentVariant(activeMeta.id)}
              onChange={(v) => setVariant(activeMeta.id, v)}
            />
          </div>
        ) : null}

        <div className="sticky bottom-0 border-t border-border bg-card px-4 py-4 supports-[padding:max(0px)]:pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:pb-4">
          <Button
            type="button"
            className="h-12 w-full text-base"
            onClick={onConfirm}
            disabled={gerando}
          >
            {gerando ? (
              <>
                <ProgressActivity size={18} className="animate-spin" />{" "}
                Salvando...
              </>
            ) : (
              <>
                Confirmar e Criar <ArrowForward size={18} />
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Preview grande */}
      <main
        className={cn(
          "relative flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/30",
          !showPreviewPanel && "hidden",
        )}
      >
        <div className="flex items-center justify-end gap-3 border-b border-border bg-card px-4 py-2.5">
          <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
            {(
              [
                { id: "desktop", label: "Desktop", Icon: DesktopWindows },
                { id: "tablet", label: "Tablet", Icon: Tablet },
                { id: "mobile", label: "Mobile", Icon: Devices },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewport(id)}
                aria-pressed={viewport === id}
                title={label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                  viewport === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <DevicePreview mode={viewport}>
            <div
              style={themeToCssVars(theme)}
              className="lp-root min-h-full bg-white text-ink"
            >
              {renderSectionPreview(activeSection)}
            </div>
          </DevicePreview>
        </div>
      </main>

      {!isLgUp ? (
        <nav
          aria-label="Alternar painel do layout"
          className="flex shrink-0 border-t border-border bg-background supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button
            type="button"
            onClick={() => setMobileTab("sections")}
            aria-pressed={mobileTab === "sections"}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
              mobileTab === "sections"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Tune size={20} />
            Seções
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            aria-pressed={mobileTab === "preview"}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
              mobileTab === "preview"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Visibility size={20} />
            Prévia
          </button>
        </nav>
      ) : null}
    </div>
  );
}
