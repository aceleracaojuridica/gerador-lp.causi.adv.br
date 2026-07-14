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
import {
  DOR_VARIANT_IMAGE_ICON_LIST,
  DOR_VARIANT_IMAGE_LIST,
} from "@/lib/landing-pages/variants";
import { cardGridCols } from "./card-grid";
import { HeadlineText } from "./headline-text";
import { ImageIconListBlock } from "./image-icon-list-block";
import { ImageListBlock } from "./image-list-block";

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
  const sectionBg = dark ? "bg-lp-brand" : "bg-lp-cream";

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
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-lp-accent/[0.08]"
        />
      )}

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {variant === DOR_VARIANT_IMAGE_LIST ? (
          <DorImageList content={content} dark={dark} image={image} />
        ) : variant === DOR_VARIANT_IMAGE_ICON_LIST ? (
          <ImageIconListBlock
            eyebrow={content.eyebrow}
            headline={content.headline}
            intro={content.intro}
            items={content.cards.map((d) => ({
              icon: d.icon,
              title: d.title,
              text: d.text,
              key: `${d.title}-${d.text}`,
            }))}
            image={image}
            dark={dark}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <Reveal>
                <Header content={content} dark={dark} />
              </Reveal>
              <Reveal delay={120}>
                <div
                  className="relative h-72 overflow-hidden rounded-tl-[var(--lp-corner)] rounded-br-[var(--lp-corner)] bg-lp-brand md:h-80"
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

            <CardGrid content={content} dark={dark} />
          </>
        )}
      </div>
    </section>
  );
}

function Header({ content, dark }: { content: DorContent; dark: boolean }) {
  return (
    <>
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
      <p
        className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/80" : "text-lp-ink-soft"}`}
      >
        {content.intro}
      </p>
    </>
  );
}

/* Lista enxuta reutilizável (header + bullets + imagem), compartilhada com a
   seção Solução via ImageListBlock. */
function DorImageList({
  content,
  dark,
  image,
}: {
  content: DorContent;
  dark: boolean;
  image: string;
}) {
  return (
    <ImageListBlock
      eyebrow={content.eyebrow}
      headline={content.headline}
      intro={content.intro}
      items={content.cards.map((d) => ({
        title: d.title,
        key: `${d.title}-${d.text}`,
      }))}
      image={image}
      dark={dark}
    />
  );
}

function CardGrid({ content, dark }: { content: DorContent; dark: boolean }) {
  return (
    <div
      className={`mt-14 grid grid-cols-1 gap-5 md:gap-6 ${cardGridCols(
        content.cards.length,
      )}`}
    >
      {content.cards.map((d, i) => {
        return (
          <Reveal key={`${d.title}-${d.text}`} delay={i * 90}>
            <div
              className={`h-full rounded-xl p-7 transition hover:-translate-y-0.5 hover:shadow-sm ${
                dark
                  ? "bg-white/[0.06] ring-1 ring-white/10"
                  : "bg-white ring-1 ring-lp-ink-soft/10"
              }`}
            >
              <span
                className={`mb-5 flex h-11 w-11 items-center justify-center rounded-full border ${
                  dark
                    ? "border-lp-accent-soft text-lp-accent-soft"
                    : "border-lp-accent text-lp-accent"
                }`}
              >
                <IconForKey iconKey={d.icon} size={28} />
              </span>
              <h3
                className={`font-display text-xl font-semibold leading-snug ${dark ? "text-white" : "text-lp-brand"}`}
              >
                {d.title}
              </h3>
              <p
                className={`mt-2 text-[1.05rem] leading-relaxed ${dark ? "text-white/70" : "text-lp-ink-soft"}`}
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
