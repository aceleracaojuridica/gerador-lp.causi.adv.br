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
import type {
  SolucaoContent,
  SolucaoVariant,
  Tone,
} from "@/lib/landing-pages/schema";
import {
  SOLUCAO_VARIANT_IMAGE_LIST,
  SOLUCAO_VARIANT_WITH_IMAGE_CARDS,
} from "@/lib/landing-pages/variants";
import { HeadlineText } from "./headline-text";
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

type SolucaoProps = {
  content: SolucaoContent;
  variant: SolucaoVariant; // LAYOUT: com imagem · só cards · cards com destaque
  tone: Tone; // COR: claro · escuro
  accentRgb: string;
  brandRgb: string;
  brandDarkRgb: string;
  image: string; // usada no comImagem (vazio = bloco da marca)
};

export function Solucao({
  content,
  variant,
  tone,
  accentRgb,
  brandRgb,
  brandDarkRgb,
  image,
}: SolucaoProps) {
  const dark = tone === "dark";
  const comImagem = variant === SOLUCAO_VARIANT_WITH_IMAGE_CARDS;
  const listaImagem = variant === SOLUCAO_VARIANT_IMAGE_LIST;

  return (
    <section
      className={`relative overflow-hidden py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(${accentRgb},${dark ? 0.13 : 0.08}), transparent 65%)`,
        }}
      />
      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {listaImagem ? (
          <ImageListBlock
            eyebrow={content.eyebrow}
            headline={content.headline}
            intro={content.sub}
            items={content.cards.map((c) => ({
              title: c.title,
              key: `${c.title}-${c.text}`,
            }))}
            image={image}
            dark={dark}
          />
        ) : (
          <>
            {comImagem ? (
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
                <Reveal>
                  <Header content={content} dark={dark} />
                </Reveal>
                <Reveal delay={120}>
                  <div
                    className="relative h-72 overflow-hidden rounded-tl-[3rem] rounded-br-[3rem] bg-lp-brand md:h-80"
                    style={
                      image
                        ? {
                            backgroundImage: `${cardImageOverlay(brandRgb, brandDarkRgb, "solucao")}, url('${image}')`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : undefined
                    }
                  />
                </Reveal>
              </div>
            ) : (
              <Reveal className="mx-auto max-w-2xl text-center">
                <Header content={content} dark={dark} />
              </Reveal>
            )}

            <Cards content={content} />
          </>
        )}
      </div>
    </section>
  );
}

function Header({ content, dark }: { content: SolucaoContent; dark: boolean }) {
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
        {content.sub}
      </p>
    </>
  );
}

/*
  cards uniformes (brancos com borda superior dourada). Funcionam tanto sobre
  fundo claro quanto escuro.
*/
function Cards({ content }: { content: SolucaoContent }) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {content.cards.map((c, i) => {
        return (
          <Reveal key={`${c.title}-${c.text}`} delay={i * 80}>
            <div className="relative h-full overflow-hidden rounded-xl border-t-2 border-lp-accent bg-white p-7 ring-1 ring-lp-ink-soft/10 transition hover:-translate-y-0.5">
              <span className="relative mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-lp-accent text-lp-accent">
                <IconForKey iconKey={c.icon} size={28} />
              </span>
              <h3 className="relative font-display text-lg font-semibold leading-snug text-lp-brand">
                {c.title}
              </h3>
              <p className="relative mt-2 text-[1.05rem] leading-relaxed text-lp-ink-soft">
                {c.text}
              </p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
