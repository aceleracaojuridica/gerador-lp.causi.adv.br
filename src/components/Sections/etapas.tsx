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

/* ===== Tema 1 — Numerado (colunas centradas, sem linha conectora) =====
   Número grande em serifa acima, título e texto centralizados. */
function Numerado({
  content,
  dark,
}: {
  content: EtapasContent;
  dark: boolean;
}) {
  // A grade acompanha a quantidade de passos para as colunas ficarem sempre
  // cheias e centradas (3 passos não deixam um vão de 4ª coluna).
  const count = content.steps.length;
  const colsCls =
    count >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : count === 3
        ? "sm:grid-cols-3"
        : count === 2
          ? "sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <Header content={content} dark={dark} centered />
        </Reveal>
        <div
          className={`mt-16 grid grid-cols-1 gap-x-10 gap-y-12 md:gap-x-14 ${colsCls}`}
        >
          {content.steps.map((s, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a key precisa ser posicional. Derivá-la do texto do card faz o Reveal remontar a cada tecla no editor (volta a visible:false e refaz o fade) — a seção pisca. A lista não reordena.
            <Reveal key={`etapa-${i}`} delay={i * 80}>
              <div className="mx-auto max-w-xs text-center">
                <span
                  className={`block font-display text-5xl leading-none md:text-6xl ${
                    dark ? "text-white/30" : "text-lp-brand/25"
                  }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={`mt-6 font-display text-xl font-semibold leading-snug ${dark ? "text-white" : "text-lp-brand"}`}
                >
                  {s.title}
                </h3>
                <p
                  className={`mt-3 text-[1.05rem] leading-relaxed ${dark ? "text-white/75" : "text-lp-ink-soft"}`}
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
