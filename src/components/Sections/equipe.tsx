import { Reveal } from "@/components/ui/reveal";
import type { EquipeVariant, Lawyer, Tone } from "@/lib/landing-pages/schema";
import { focalPos } from "@/lib/landing-pages/schema";

type EquipeProps = {
  lawyers: Lawyer[];
  brandRgb: string;
  tone: Tone;
  variant?: EquipeVariant;
};

/**
 * Seção Equipe — só com 2+ advogados (1 = solo, aparece no Sobre). Dois temas:
 *  - splitAlternado: foto + texto alternando (imagem compacta para não esticar).
 *  - retratoElegante: grid de retratos com gradiente (2 = centralizado, 3 = 3 cols, 4 = 2×2).
 * Se variant não for definida, auto-seleciona pela quantidade.
 */
export function Equipe({ lawyers, brandRgb, tone, variant }: EquipeProps) {
  if (lawyers.length < 2) return null;
  const dark = tone === "dark";
  const tema =
    variant ?? (lawyers.length <= 3 ? "splitAlternado" : "retratoElegante");

  return (
    <section
      className={`py-16 md:py-24 ${dark ? "bg-brand-dark" : "bg-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <Reveal>
          <p
            className={`eyebrow mb-3 ${dark ? "text-accent-soft" : "text-accent"}`}
          >
            Nossa equipe
          </p>
          <h2
            className={`section-title max-w-2xl ${dark ? "text-white" : "text-brand"}`}
          >
            Profissionais dedicados ao{" "}
            <span
              style={{
                color: dark
                  ? "var(--lp-accent-soft)"
                  : "var(--lp-accent)",
              }}
            >
              seu caso
            </span>
          </h2>
        </Reveal>

        {tema === "splitAlternado" ? (
          <SplitAlternado lawyers={lawyers} dark={dark} />
        ) : (
          <RetratoElegante lawyers={lawyers} brandRgb={brandRgb} />
        )}
      </div>
    </section>
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
                  className="h-56 w-full rounded-tl-[2rem] rounded-br-[2rem] bg-brand bg-cover shadow-md md:h-64 lg:h-72"
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
                <span className="mb-3 block h-1 w-10 rounded-full bg-accent" />
                <h3
                  className={`font-display text-2xl font-semibold leading-tight md:text-3xl ${dark ? "text-white" : "text-brand"}`}
                >
                  {l.name || "Advogado(a)"}
                </h3>
                {l.role ? (
                  <p
                    className={`mt-2 text-lg font-medium ${dark ? "text-accent-soft" : "text-accent"}`}
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
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand shadow-md">
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
              <span className="mb-2 block h-0.5 w-9 bg-accent" />
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
