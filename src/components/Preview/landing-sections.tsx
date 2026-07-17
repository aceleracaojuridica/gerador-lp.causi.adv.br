import { Areas } from "@/components/Sections/areas";
import { CtaFinal } from "@/components/Sections/cta-final";
import { CustomSection } from "@/components/Sections/custom-section";
import { Dor } from "@/components/Sections/dor";
import { Equipe } from "@/components/Sections/equipe";
import { Etapas } from "@/components/Sections/etapas";
import { FAQ } from "@/components/Sections/faq";
import { Footer } from "@/components/Sections/footer";
import { Hero } from "@/components/Sections/hero";
import { Sobre } from "@/components/Sections/sobre";
import { Solucao } from "@/components/Sections/solucao";
import { hexToRgbString } from "@/lib/landing-pages/colors";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { effectiveOrder } from "@/lib/landing-pages/section-order";

const ANCHOR = "scroll-mt-2";

/**
 * Seções da LP como RSC (sem chrome de CTA/popup).
 * Importar só da rota pública — não do editor client.
 */
export function LandingSections({
  schema,
  demo = false,
}: {
  schema: LpSchema;
  demo?: boolean;
}) {
  const accentRgb = hexToRgbString(schema.theme.accent);
  const brandRgb = hexToRgbString(schema.theme.brand);
  const brandDarkRgb = hexToRgbString(schema.theme.brandDark);
  const creamRgb = hexToRgbString(schema.theme.cream);
  const creamDeepRgb = hexToRgbString(schema.theme.creamDeep);
  const hidden = schema.layout.hidden ?? {};
  const customSections = schema.customSections ?? [];
  const order = effectiveOrder(schema.layout, customSections);

  const heroAnchorCta =
    !hidden.areas && order.includes("areas")
      ? { label: "Áreas de atuação", href: "#sec-areas" }
      : { label: "Sobre o escritório", href: "#sec-sobre" };

  function renderItem(item: string) {
    if (item.startsWith("custom:")) {
      const id = item.slice(7);
      const sec = customSections.find((s) => s.id === id);
      if (!sec) return null;
      return (
        <div key={item} id={`sec-custom-${sec.id}`} className={ANCHOR}>
          <CustomSection section={sec} demo={demo} />
        </div>
      );
    }
    switch (item) {
      case "dor":
        return (
          <div key="dor" id="sec-dor" className={ANCHOR}>
            <Dor
              content={schema.dor}
              variant={schema.layout.dor}
              tone={schema.layout.tones.dor}
              accentRgb={accentRgb}
              brandRgb={brandRgb}
              brandDarkRgb={brandDarkRgb}
              image={schema.office.sectionImages?.dor}
            />
          </div>
        );
      case "solucao":
        return (
          <div key="solucao" id="sec-solucao" className={ANCHOR}>
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
          <div key="sobre" id="sec-sobre" className={ANCHOR}>
            <Sobre
              office={schema.office}
              variant={schema.layout.sobre}
              tone={schema.layout.tones.sobre}
              content={schema.sobre}
            />
          </div>
        );
      case "equipe":
        return hidden.equipe ? null : (
          <div key="equipe" id="sec-equipe" className={ANCHOR}>
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
          <div key="areas" id="sec-areas" className={ANCHOR}>
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
          <div key="etapas" id="sec-etapas" className={ANCHOR}>
            <Etapas
              content={schema.etapas}
              variant={schema.layout.etapas}
              tone={schema.layout.tones.etapas}
            />
          </div>
        );
      case "ctaFinal":
        return hidden.ctaFinal ? null : (
          <div key="ctaFinal" id="sec-ctaFinal" className={ANCHOR}>
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
    <>
      <div id="sec-hero" className={ANCHOR}>
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
        />
      </div>
      {order.map(renderItem)}
      {!hidden.faq ? (
        <div id="sec-faq" className={ANCHOR}>
          <FAQ content={schema.faq} tone={schema.layout.tones.faq} />
        </div>
      ) : null}
      <div id="sec-footer" className={ANCHOR}>
        <Footer office={schema.office} />
      </div>
    </>
  );
}
