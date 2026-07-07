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
import { AREAS_VARIANT_LIST_BANDS } from "@/lib/landing-pages/variants";
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

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
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

        <div
          className={
            variant === AREAS_VARIANT_LIST_BANDS
              ? "mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4"
              : "mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6"
          }
        >
          {content.cards.map((a, i) => {
            return (
              <Reveal key={`${a.title}-${a.text}`} delay={i * 80}>
                <div className="flex h-full items-start gap-5 rounded-2xl bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-lp-brand text-lp-accent-soft">
                    <IconForKey iconKey={a.icon} size={28} />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-lp-brand">
                      {a.title}
                    </h3>
                    <p className="mt-2 text-[1.05rem] leading-relaxed text-lp-ink-soft">
                      {a.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12 text-center" delay={120}>
          <CTAButton variant="primary">{content.cta}</CTAButton>
        </Reveal>
      </div>
    </section>
  );
}
