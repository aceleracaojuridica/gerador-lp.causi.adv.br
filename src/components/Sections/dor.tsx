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
import { Reveal } from "@/components/ui/reveal";
import { cardImageOverlay } from "@/lib/landing-pages/colors";
import type { DorContent, DorVariant, Tone } from "@/lib/landing-pages/schema";
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

type DorProps = {
  content: DorContent;
  variant: DorVariant; // LAYOUT: com imagem + cards · só cards
  tone: Tone; // COR: claro · escuro (independente do layout)
  accentRgb: string;
  brandRgb: string;
  brandDarkRgb: string;
  image: string; // imagem da seção (vazio = bloco da marca) — usada no comImagem
};

export function Dor({
  content,
  variant,
  tone,
  accentRgb,
  brandRgb,
  brandDarkRgb,
  image,
}: DorProps) {
  const dark = tone === "dark";
  const sectionBg = dark ? "bg-brand" : "bg-white";

  return (
    <section className={`relative overflow-hidden py-20 md:py-28 ${sectionBg}`}>
      {dark ? (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb},0.14), transparent 65%)`,
          }}
        />
      ) : (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-10 h-72 w-[34rem] rounded-full bg-cream-deep/50"
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {variant === "comImagem" ? (
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <Header content={content} dark={dark} />
            </Reveal>
            <Reveal delay={120}>
              <div
                className="relative h-72 overflow-hidden rounded-tl-[3rem] rounded-br-[3rem] bg-brand md:h-80"
                style={
                  image
                    ? {
                      backgroundImage: `${cardImageOverlay(brandRgb, brandDarkRgb, "dor")}, url('${image}')`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                    : undefined
                }
              >
                <div
                  aria-hidden
                  className="absolute -bottom-8 -right-8 h-36 w-36 rounded-full border-2"
                  style={{ borderColor: `rgba(${accentRgb},0.4)` }}
                />
              </div>
            </Reveal>
          </div>
        ) : (
          <Reveal className="mx-auto max-w-2xl text-center">
            <Header content={content} dark={dark} centered />
          </Reveal>
        )}

        <CardGrid content={content} dark={dark} />
      </div>
    </section>
  );
}

function Header({
  content,
  dark,
  centered,
}: {
  content: DorContent;
  dark: boolean;
  centered?: boolean;
}) {
  return (
    <>
      <p
        className={`eyebrow mb-3 ${dark ? "text-accent-soft" : "text-accent"}`}
      >
        {content.eyebrow}
      </p>
      <h2 className={`section-title ${dark ? "text-white" : "text-brand"}`}>
        <HeadlineText
          h={content.headline}
          accentVar={dark ? "accent-soft" : "accent"}
        />
      </h2>
      <p
        className={`mt-5 text-lg leading-relaxed ${centered ? "" : ""} ${dark ? "text-white/80" : "text-ink-soft"}`}
      >
        {content.intro}
      </p>
    </>
  );
}

function CardGrid({ content, dark }: { content: DorContent; dark: boolean }) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
      {content.cards.map((d, i) => {
        return (
          <Reveal key={`${d.title}-${d.text}`} delay={i * 90}>
            <div
              className={`h-full rounded-2xl p-7 transition hover:-translate-y-1 ${dark
                  ? "bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/[0.09]"
                  : "bg-cream hover:shadow-lg"
                }`}
            >
              <span
                className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${dark
                    ? "bg-accent text-brand-dark"
                    : "bg-brand text-accent-soft"
                  }`}
              >
                <IconForKey iconKey={d.icon} size={28} />
              </span>
              <h3
                className={`font-display text-2xl font-bold ${dark ? "text-white" : "text-brand"}`}
              >
                {d.title}
              </h3>
              <p
                className={`mt-2 text-[1.05rem] leading-relaxed ${dark ? "text-white/70" : "text-ink-soft"}`}
              >
                {d.text}
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
