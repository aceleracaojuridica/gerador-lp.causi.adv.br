import {
  AccountBalance,
  Apartment,
  Article,
  Balance,
  Calculate,
  ChildCare,
  Description,
  DirectionsCar,
  Gavel,
  GppBad,
  Group,
  Handshake,
  Home,
  HowToReg,
  LaptopMac,
  MonitorHeart,
  NotificationsActive,
  Paid,
  Payments,
  Savings,
  Schedule,
  Search,
  Star,
  Stethoscope,
  Timer,
  Trophy,
  VerifiedUser,
  Warning,
  Work,
} from "@material-symbols-svg/react";
import { CTAButton } from "@/components/ui/cta-button";
import { Reveal } from "@/components/ui/reveal";
import type {
  AreasContent,
  AreasVariant,
  Tone,
} from "@/lib/landing-pages/schema";
import { AREAS_VARIANT_QUADRANT_GRID } from "@/lib/landing-pages/variants";
import { HeadlineText } from "./headline-text";

function IconForKey({ iconKey, size }: { iconKey: string; size: number }) {
  switch (iconKey) {
    case "shield-check":
      return <VerifiedUser size={size} />;
    case "clock":
      return <Schedule size={size} />;
    case "handshake":
      return <Handshake size={size} />;
    case "file-x":
    case "file-text":
      return <Description size={size} />;
    case "timer":
      return <Timer size={size} />;
    case "alert":
      return <Warning size={size} />;
    case "search":
      return <Search size={size} />;
    case "calculator":
      return <Calculate size={size} />;
    case "gavel":
      return <Gavel size={size} />;
    case "bell":
      return <NotificationsActive size={size} />;
    case "banknote":
      return <Payments size={size} />;
    case "trophy":
      return <Trophy size={size} />;
    case "laptop":
      return <LaptopMac size={size} />;
    case "star":
      return <Star size={size} />;
    case "user-check":
      return <HowToReg size={size} />;
    case "shield-x":
      return <GppBad size={size} />;
    case "scale":
      return <Balance size={size} />;
    case "heart-pulse":
      return <MonitorHeart size={size} />;
    case "home":
      return <Home size={size} />;
    case "briefcase":
      return <Work size={size} />;
    case "users":
      return <Group size={size} />;
    case "landmark":
      return <AccountBalance size={size} />;
    case "badge-dollar":
      return <Paid size={size} />;
    case "hand-coins":
      return <Savings size={size} />;
    case "stethoscope":
      return <Stethoscope size={size} />;
    case "baby":
      return <ChildCare size={size} />;
    case "building":
      return <Apartment size={size} />;
    case "car":
      return <DirectionsCar size={size} />;
    case "scroll":
      return <Article size={size} />;
    default:
      return <Balance size={size} />;
  }
}

type AreasProps = {
  content: AreasContent;
  variant: AreasVariant;
  accentRgb: string;
  tone: Tone;
};

export function Areas({ content, variant, accentRgb, tone }: AreasProps) {
  const dark = tone === "dark";
  const props = { content, dark, accentRgb };
  return variant === AREAS_VARIANT_QUADRANT_GRID ? (
    <Quadrantes {...props} />
  ) : (
    <Grade {...props} />
  );
}

type VariantProps = { content: AreasContent; dark: boolean; accentRgb: string };

/** Casca comum: fundo, brilho decorativo e container. */
function Shell({
  dark,
  accentRgb,
  children,
}: {
  dark: boolean;
  accentRgb: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id="areas"
      className={`relative overflow-hidden py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${accentRgb},${dark ? 0.14 : 0.08}), transparent 65%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">{children}</div>
    </section>
  );
}

/* ===== Variante 1 — Grade de cards com ícone ===== */
function Grade({ content, dark, accentRgb }: VariantProps) {
  return (
    <Shell dark={dark} accentRgb={accentRgb}>
      <Reveal className="mx-auto max-w-2xl text-center">
        <p
          className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
        >
          {content.eyebrow}
        </p>
        <h2
          className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
        >
          <HeadlineText
            h={content.headline}
            accentVar={dark ? "accent-soft" : "accent"}
          />
        </h2>
        <p
          className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/80" : "text-lp-ink-soft"}`}
        >
          {content.sub}
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
        {content.cards.map((a, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a key precisa ser posicional. Derivá-la do texto do card faz o Reveal remontar a cada tecla no editor (volta a visible:false e refaz o fade) — a seção pisca. A lista não reordena.
          <Reveal key={`areas-card-${i}`} delay={i * 80}>
            <div className="flex h-full items-start gap-5 rounded-xl bg-white p-7 ring-1 ring-lp-ink-soft/10 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-lp-accent text-lp-accent">
                <IconForKey iconKey={a.icon} size={28} />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold leading-snug text-lp-brand">
                  {a.title}
                </h3>
                <p className="mt-2 text-[1.05rem] leading-relaxed text-lp-ink-soft">
                  {a.text}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 text-center" delay={120}>
        <CTAButton variant="primary">{content.cta}</CTAButton>
      </Reveal>
    </Shell>
  );
}

/* ===== Variante 2 — Quadrantes =====
   Header alinhado à esquerda e as áreas numa grade dividida por linhas (sem
   fundo de card): ícone + título, descrição, sub-itens em bullets e um link
   de CTA por quadrante. */
function Quadrantes({ content, dark, accentRgb }: VariantProps) {
  const line = dark ? "border-white/12" : "border-lp-ink-soft/20";
  const bullet = dark ? "bg-lp-accent-soft" : "bg-lp-accent";

  return (
    <Shell dark={dark} accentRgb={accentRgb}>
      <Reveal className="max-w-3xl">
        <p
          className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
        >
          {content.eyebrow}
        </p>
        <h2
          className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
        >
          <HeadlineText
            h={content.headline}
            accentVar={dark ? "accent-soft" : "accent"}
          />
        </h2>
      </Reveal>

      {/* rounded-2xl deriva de --radius, então a moldura da grade acompanha o
          toggle Aparência → cantos. overflow-hidden faz as divisórias internas
          respeitarem o recorte dos cantos. */}
      <div
        className={`mt-14 grid grid-cols-1 overflow-hidden rounded-2xl border-t border-l md:grid-cols-2 ${line}`}
      >
        {content.cards.map((a, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a key precisa ser posicional. Derivá-la do texto do card faz o Reveal remontar a cada tecla no editor (volta a visible:false e refaz o fade) — a seção pisca. A lista não reordena.
          <Reveal key={`areas-card-${i}`} delay={i * 80}>
            <div className={`h-full border-r border-b p-7 md:p-10 ${line}`}>
              <div className="flex items-center gap-3">
                <span
                  className={dark ? "text-lp-accent-soft" : "text-lp-accent"}
                >
                  <IconForKey iconKey={a.icon} size={24} />
                </span>
                <h3
                  className={`font-display text-xl font-semibold leading-snug md:text-2xl ${
                    dark ? "text-white" : "text-lp-brand"
                  }`}
                >
                  {a.title}
                </h3>
              </div>

              <p
                className={`mt-4 leading-relaxed ${dark ? "text-white/75" : "text-lp-ink-soft"}`}
              >
                {a.text}
              </p>

              {a.items?.length ? (
                <ul className="mt-6 space-y-2.5">
                  {a.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden
                        className={`mt-[0.5rem] h-1 w-1 shrink-0 rounded-full ${bullet}`}
                      />
                      <span
                        className={`text-sm leading-snug ${dark ? "text-white/80" : "text-lp-ink"}`}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}
