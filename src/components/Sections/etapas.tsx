import { Reveal } from "@/components/ui/reveal";
import type {
  EtapasContent,
  EtapasVariant,
  Tone,
} from "@/lib/landing-pages/schema";
import { ETAPAS_VARIANT_TIMELINE_FLOW } from "@/lib/landing-pages/variants";
import { HeadlineText } from "./headline-text";

type EtapasProps = {
  content: EtapasContent;
  variant: EtapasVariant; // numerado (horizontal) · timeline (guia)
  tone: Tone;
};

export function Etapas({ content, variant, tone }: EtapasProps) {
  if (!content?.steps?.length) return null;
  return variant === ETAPAS_VARIANT_TIMELINE_FLOW ? (
    <Timeline content={content} dark={tone === "dark"} />
  ) : (
    <Numerado content={content} dark={tone === "dark"} />
  );
}

function Header({
  content,
  dark,
  centered,
}: {
  content: EtapasContent;
  dark: boolean;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mx-auto max-w-2xl text-center" : ""}>
      <p
        className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
      >
        {content.eyebrow}
      </p>
      <h2 className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}>
        <HeadlineText
          h={content.headline}
          accentVar={dark ? "accent-soft" : "accent"}
        />
      </h2>
    </div>
  );
}

/* ===== Tema 1 — Numerado (horizontal) ===== */
function Numerado({
  content,
  dark,
}: {
  content: EtapasContent;
  dark: boolean;
}) {
  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <Header content={content} dark={dark} centered />
        </Reveal>
        <div className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Linha conectora horizontal no desktop */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-0.5 bg-lp-accent/20 lg:block z-0"
          />
          {content.steps.map((s, i) => (
            <Reveal
              key={`${s.title}-${s.text}`}
              delay={i * 80}
              className="relative z-10"
            >
              <div className="text-center lg:text-left">
                <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-lp-accent bg-white font-display text-lg font-bold text-lp-brand shadow-sm lg:mx-0">
                  {i + 1}
                </span>
                <h3
                  className={`font-display text-lg font-semibold leading-snug ${dark ? "text-white" : "text-lp-brand"}`}
                >
                  {s.title}
                </h3>
                <p
                  className={`mt-2 text-[1.05rem] leading-relaxed ${dark ? "text-white/75" : "text-lp-ink-soft"}`}
                >
                  {s.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ===== Tema 2 — Guia (título + timeline) ===== */
function Timeline({
  content,
  dark,
}: {
  content: EtapasContent;
  dark: boolean;
}) {
  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-10">
        <div
          className={`relative overflow-hidden rounded-3xl p-8 md:p-12 ${
            dark
              ? "bg-white/[0.04] ring-1 ring-white/10"
              : "bg-white shadow-sm ring-1 ring-lp-ink-soft/10"
          }`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute right-6 top-0 font-display text-[7rem] leading-none text-lp-accent/10"
          >
            &rdquo;
          </span>
          <div className="relative grid gap-10 lg:grid-cols-[40%_60%] lg:gap-14">
            <Reveal className="lg:self-center">
              <Header content={content} dark={dark} />
            </Reveal>
            <Reveal delay={120}>
              <ol className="relative space-y-7 border-l-2 border-lp-accent/30 pl-6">
                {content.steps.map((s, i) => (
                  <li key={`${s.title}-${s.text}`} className="relative">
                    <span className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full bg-lp-accent" />
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lp-accent">
                      Passo {i + 1}
                    </p>
                    <h3
                      className={`mt-1 font-display text-xl font-bold ${dark ? "text-white" : "text-lp-brand"}`}
                    >
                      {s.title}
                    </h3>
                    <p
                      className={`mt-1 text-[1.05rem] leading-relaxed ${dark ? "text-white/75" : "text-lp-ink-soft"}`}
                    >
                      {s.text}
                    </p>
                  </li>
                ))}
              </ol>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
