import { CheckCircle } from "@material-symbols-svg/react";
import { CTAButton } from "@/components/ui/cta-button";
import { Reveal } from "@/components/ui/reveal";
import { DEFAULT_SOBRE_CONTENT } from "@/lib/landing-pages/focos";
import type {
  Headline,
  Office,
  SobreContent,
  SobreVariant,
  Tone,
} from "@/lib/landing-pages/schema";
import { focalPos } from "@/lib/landing-pages/schema";
import {
  SOBRE_VARIANT_OVERLAY_PORTRAIT,
  SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT,
} from "@/lib/landing-pages/variants";

type SobreProps = {
  office: Office;
  variant: SobreVariant;
  tone: Tone;
  content?: SobreContent;
};

/**
 * Seção "Sobre o escritório" — 3 layouts (overlay · duasColunas · fotoLista),
 * cada um em tom claro ou escuro (independente do layout).
 * A imagem vem de office.sectionImages.sobre (ou da foto do advogado solo).
 * Renderiza só se houver texto OU diferenciais.
 */
export function Sobre({ office, variant, tone, content }: SobreProps) {
  const hasText = office.about.trim().length > 0;
  if (!hasText && office.diferenciais.length === 0) return null;
  const dark = tone === "dark";
  const eyebrow = content?.eyebrow ?? DEFAULT_SOBRE_CONTENT.eyebrow;
  const headline = content?.headline ?? DEFAULT_SOBRE_CONTENT.headline;

  const shared = { office, hasText, dark, eyebrow, headline };
  if (variant === SOBRE_VARIANT_OVERLAY_PORTRAIT)
    return <Overlay {...shared} />;
  if (variant === SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT)
    return <DuasColunas {...shared} />;
  return <FotoLista {...shared} />;
}

type LayoutProps = {
  office: Office;
  hasText: boolean;
  dark: boolean;
  eyebrow: string;
  headline: Headline;
};

function Title({ dark, headline }: { dark: boolean; headline: Headline }) {
  return (
    <h2 className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}>
      {headline.pre}
      {headline.em ? (
        <span
          style={{
            color: dark ? "var(--lp-accent-soft)" : "var(--lp-accent)",
          }}
        >
          {headline.em}
        </span>
      ) : null}
      {headline.post}
    </h2>
  );
}

function AboutParas({ about, dark }: { about: string; dark: boolean }) {
  const paragraphs = withStableTextKeys(
    about
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  );

  return (
    <div
      className={`mt-5 space-y-4 text-lg leading-relaxed ${dark ? "text-white/85" : "text-lp-ink-soft"}`}
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph.key}>{paragraph.value}</p>
      ))}
    </div>
  );
}

function withStableTextKeys(items: string[]) {
  const seen = new Map<string, number>();

  return items.map((value) => {
    const occurrence = (seen.get(value) ?? 0) + 1;
    seen.set(value, occurrence);

    return {
      key: `${value}-${occurrence}`,
      value,
    };
  });
}

// Imagem do bloco "Sobre": advogado solo (1 foto) usa a própria foto; equipe
// (2+) ou sem foto usa a imagem de cenário/escritório.
function sobreImg(office: Office): string {
  return office.lawyers.length === 1
    ? office.lawyers[0].photo
    : office.sectionImages.sobre;
}

// Enquadramento: foto do advogado solo usa o focal dele; imagem de cenário
// (equipe/sem foto) usa o focal definido na seção (Enquadrar do editor).
function sobrePos(office: Office): string {
  return office.lawyers.length === 1
    ? focalPos(office.lawyers[0].focal)
    : focalPos(office.sectionImageFocals?.sobre);
}

function imgStyle(
  src: string,
  pos = "center",
): React.CSSProperties | undefined {
  return src
    ? {
        backgroundImage: `url('${src}')`,
        backgroundSize: "cover",
        backgroundPosition: pos,
      }
    : undefined;
}

/* ===== Tema 1 — Hero com Overlay (foto flutuante) ===== */
function Overlay({ office, hasText, dark, eyebrow, headline }: LayoutProps) {
  const img = sobreImg(office);
  const pos = sobrePos(office);
  return (
    <section
      className={`relative overflow-hidden py-20 md:py-28 ${dark ? "bg-lp-brand" : "bg-lp-cream"}`}
    >
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 md:px-10 lg:grid-cols-[58%_42%]">
        <Reveal>
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {eyebrow}
          </p>
          <Title dark={dark} headline={headline} />
          {hasText ? <AboutParas about={office.about} dark={dark} /> : null}
          <div className="mt-8">
            <CTAButton variant={dark ? "primary" : "accent"}>
              Falar com o escritório
            </CTAButton>
          </div>
        </Reveal>

        <Reveal delay={120} className="hidden lg:block">
          {/* rounded-2xl deriva de --radius: acompanha o toggle
              Aparência → cantos (arredondado / quadrado). */}
          <div
            className="h-[26rem] w-full rounded-2xl bg-lp-brand-dark"
            style={imgStyle(img, pos)}
          />
        </Reveal>
      </div>
    </section>
  );
}

/* ===== Tema 2 — Duas Colunas (foto full-height à esquerda) ===== */
function DuasColunas({
  office,
  hasText,
  dark,
  eyebrow,
  headline,
}: LayoutProps) {
  const img = sobreImg(office);
  const pos = sobrePos(office);
  const diferenciais = withStableTextKeys(office.diferenciais);

  return (
    <section className={dark ? "bg-lp-brand" : "bg-lp-cream"}>
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div
          aria-hidden
          className="hidden min-h-[24rem] bg-lp-brand-dark lg:block"
          style={imgStyle(img, pos)}
        />
        <Reveal className="px-6 py-16 md:px-12 md:py-24">
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {eyebrow}
          </p>
          <Title dark={dark} headline={headline} />
          {hasText ? <AboutParas about={office.about} dark={dark} /> : null}
          {diferenciais.length > 0 ? (
            <ul className="mt-6 space-y-2.5">
              {diferenciais.map((diferencial) => (
                <li key={diferencial.key} className="flex items-start gap-3">
                  <CheckCircle
                    size={20}
                    className={`mt-0.5 shrink-0 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
                  />
                  <span
                    className={`leading-relaxed ${dark ? "text-white/90" : "text-lp-ink"}`}
                  >
                    {diferencial.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-8">
            <CTAButton variant={dark ? "primary" : "accent"}>
              Falar com o escritório
            </CTAButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ===== Tema 3 — Foto + Lista de Diferenciais ===== */
function FotoLista({ office, hasText, dark, eyebrow, headline }: LayoutProps) {
  const img = sobreImg(office);
  const pos = sobrePos(office);
  const difs = withStableTextKeys(office.diferenciais);
  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[38%_62%] lg:gap-14">
          {img ? (
            <Reveal>
              <div
                className="min-h-[20rem] w-full rounded-[var(--lp-corner)] bg-lp-brand-dark lg:h-full"
                style={imgStyle(img, pos)}
              />
            </Reveal>
          ) : null}

          <Reveal delay={img ? 120 : 0} className={img ? "" : "lg:col-span-2"}>
            <p
              className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
            >
              {eyebrow}
            </p>
            <Title dark={dark} headline={headline} />
            {hasText ? <AboutParas about={office.about} dark={dark} /> : null}
            {difs.length > 0 ? (
              <ul className="mt-7 space-y-3">
                {difs.map((d, i) => {
                  const highlight = i === 0;
                  return (
                    <li
                      key={d.key}
                      className={`flex items-start gap-3 rounded-2xl p-4 ${
                        highlight
                          ? dark
                            ? "bg-white/[0.1] ring-1 ring-lp-accent/30"
                            : "bg-lp-brand text-white"
                          : dark
                            ? "bg-white/[0.05] ring-1 ring-white/10"
                            : "bg-white ring-1 ring-lp-ink-soft/10"
                      }`}
                    >
                      <CheckCircle
                        size={22}
                        className={`mt-0.5 shrink-0 ${
                          highlight && !dark
                            ? "text-lp-accent-soft"
                            : "text-lp-accent"
                        }`}
                      />
                      <span
                        className={`text-[0.98rem] leading-relaxed ${
                          dark
                            ? "text-white"
                            : highlight
                              ? "text-white"
                              : "text-lp-ink"
                        }`}
                      >
                        {d.value}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
