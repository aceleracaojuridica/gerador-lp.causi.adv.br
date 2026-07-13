import { Reveal } from "@/components/ui/reveal";
import type { EquipeVariant, Lawyer, Tone } from "@/lib/landing-pages/schema";
import { focalPos } from "@/lib/landing-pages/schema";
import {
  EQUIPE_VARIANT_SOLO_PORTRAIT,
  EQUIPE_VARIANT_SPLIT_ALTERNATING,
  getAutoEquipeVariant,
  isEquipeVariantAllowed,
} from "@/lib/landing-pages/variants";

type EquipeProps = {
  lawyers: Lawyer[];
  brandRgb: string;
  tone: Tone;
  variant?: EquipeVariant;
};

/**
 * Seção Equipe — aceita uma variant solo para 1 advogado e mantém o auto apenas
 * para equipes com 2+ profissionais.
 */
export function Equipe({ lawyers, brandRgb, tone, variant }: EquipeProps) {
  const resolvedVariant = variant ?? getAutoEquipeVariant(lawyers.length);
  if (!resolvedVariant) return null;
  if (!isEquipeVariantAllowed(lawyers.length, resolvedVariant)) return null;

  const dark = tone === "dark";
  const isSolo = resolvedVariant === EQUIPE_VARIANT_SOLO_PORTRAIT;

  return (
    <section
      className={`py-16 md:py-24 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {isSolo ? "Atuação direta" : "Nossa equipe"}
          </p>
          <h2
            className={`section-title max-w-2xl ${dark ? "text-white" : "text-lp-brand"}`}
          >
            {isSolo ? "Quem vai conduzir o " : "Profissionais dedicados ao "}
            <span
              style={{
                color: dark ? "var(--lp-accent-soft)" : "var(--lp-accent)",
              }}
            >
              seu caso
            </span>
          </h2>
        </Reveal>

        {resolvedVariant === EQUIPE_VARIANT_SOLO_PORTRAIT ? (
          <SoloPortrait lawyer={lawyers[0]} dark={dark} />
        ) : resolvedVariant === EQUIPE_VARIANT_SPLIT_ALTERNATING ? (
          <SplitAlternado lawyers={lawyers} dark={dark} />
        ) : (
          <RetratoElegante lawyers={lawyers} brandRgb={brandRgb} />
        )}
      </div>
    </section>
  );
}

function SoloPortrait({ lawyer, dark }: { lawyer: Lawyer; dark: boolean }) {
  return (
    <Reveal className="mt-10">
      <div className="grid items-center gap-8 lg:grid-cols-[42%_58%] lg:gap-12">
        <div
          className="h-[26rem] w-full rounded-tl-[var(--lp-corner)] rounded-br-[var(--lp-corner)] bg-lp-brand shadow-md md:h-[30rem]"
          style={
            lawyer.photo
              ? {
                  backgroundImage: `url('${lawyer.photo}')`,
                  backgroundPosition: focalPos(lawyer.focal),
                  backgroundSize: "cover",
                }
              : undefined
          }
        />
        <div>
          <span className="mb-3 block h-1 w-12 rounded-full bg-lp-accent" />
          <h3
            className={`font-display text-3xl font-semibold leading-tight md:text-4xl ${dark ? "text-white" : "text-lp-brand"}`}
          >
            {lawyer.name || "Advogado(a)"}
          </h3>
          {lawyer.role ? (
            <p
              className={`mt-3 text-lg font-medium ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
            >
              {lawyer.role}
            </p>
          ) : null}
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${dark ? "text-white/80" : "text-lp-ink-soft"}`}
          >
            Atendimento conduzido de forma direta, com acompanhamento próximo e
            leitura clara de cada etapa do caso.
          </p>
        </div>
      </div>
    </Reveal>
  );
}

/* ===== Tema 1 — Split Alternado ===== */
function SplitAlternado({
  lawyers,
  dark,
}: {
  lawyers: Lawyer[];
  dark: boolean;
}) {
  return (
    <div className="mt-10 space-y-8 md:space-y-10">
      {lawyers.map((l, i) => {
        const fotoDireita = i % 2 === 1;
        return (
          <Reveal key={`${l.name}-${l.role}`}>
            <div className="grid items-center gap-6 md:gap-10 lg:grid-cols-2">
              {/* Foto — altura contida para não inflar a seção */}
              <div className={fotoDireita ? "lg:order-2" : ""}>
                <div
                  className="h-56 w-full rounded-tl-[var(--lp-corner-sm)] rounded-br-[var(--lp-corner-sm)] bg-lp-brand bg-cover shadow-md md:h-64 lg:h-72"
                  style={
                    l.photo
                      ? {
                          backgroundImage: `url('${l.photo}')`,
                          backgroundPosition: focalPos(l.focal),
                        }
                      : undefined
                  }
                />
              </div>
              {/* Texto */}
              <div className={fotoDireita ? "lg:order-1" : ""}>
                <span className="mb-3 block h-1 w-10 rounded-full bg-lp-accent" />
                <h3
                  className={`font-display text-2xl font-semibold leading-tight md:text-3xl ${dark ? "text-white" : "text-lp-brand"}`}
                >
                  {l.name || "Advogado(a)"}
                </h3>
                {l.role ? (
                  <p
                    className={`mt-2 text-lg font-medium ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
                  >
                    {l.role}
                  </p>
                ) : null}
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ===== Tema 2 — Retrato Elegante ===== */
function RetratoElegante({
  lawyers,
  brandRgb,
}: {
  lawyers: Lawyer[];
  brandRgb: string;
}) {
  const n = lawyers.length;

  // 2 → linha única centralizada | 3 → 3 cols | 4 → 2×2
  const gridCls =
    n === 2
      ? "grid grid-cols-2 gap-5 lg:gap-6 max-w-xl mx-auto"
      : n === 4
        ? "grid grid-cols-2 gap-5 lg:gap-6 max-w-2xl mx-auto"
        : "grid grid-cols-2 gap-5 md:grid-cols-3 lg:gap-6";

  return (
    <div className={`mt-12 ${gridCls}`}>
      {lawyers.map((l, i) => (
        <Reveal key={`${l.name}-${l.role}`} delay={i * 70}>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-lp-brand shadow-md">
            {l.photo ? (
              <div
                className="absolute inset-0 bg-cover"
                style={{
                  backgroundImage: `url('${l.photo}')`,
                  backgroundPosition: focalPos(l.focal),
                }}
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(to top, rgba(${brandRgb},0.95) 0%, rgba(${brandRgb},0.5) 40%, rgba(${brandRgb},0) 68%)`,
              }}
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="mb-2 block h-0.5 w-9 bg-lp-accent" />
              <p className="font-display text-lg font-semibold leading-tight text-white">
                {l.name || "Advogado(a)"}
              </p>
              {l.role ? (
                <p className="mt-0.5 text-sm text-white/75">{l.role}</p>
              ) : null}
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
