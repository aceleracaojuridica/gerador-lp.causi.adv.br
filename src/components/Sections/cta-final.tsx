import { CTAButton } from "@/components/ui/cta-button";
import { Reveal } from "@/components/ui/reveal";
import type { CtaFinalContent, Tone } from "@/lib/landing-pages/schema";
import { HeadlineText } from "./headline-text";

export function CtaFinal({
  content,
  accentRgb,
  tone,
}: {
  content: CtaFinalContent;
  accentRgb: string;
  tone: Tone;
}) {
  const dark = tone === "dark";
  return (
    <section
      className={`relative overflow-hidden py-20 md:py-24 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full border-2"
        style={{ borderColor: `rgba(${accentRgb},0.18)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 right-0 h-80 w-80 rounded-full"
        style={{ background: `rgba(${accentRgb},0.10)` }}
      />

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <Reveal>
          {/* Eyebrow de Editorial / Fale Conosco */}
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            Contato
          </p>
          <div className="mx-auto mb-8 h-[1px] w-12 bg-lp-accent" />
          <h2
            className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h2>
          <p
            className={`mx-auto mt-5 max-w-xl text-lg leading-relaxed ${dark ? "text-white/85" : "text-lp-ink-soft"}`}
          >
            {content.sub}
          </p>
          <div className="mt-9">
            <CTAButton variant="primary">{content.cta}</CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
