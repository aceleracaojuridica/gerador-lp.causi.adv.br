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
  SOLUCAO_VARIANT_CARDS_HIGHLIGHT,
  SOLUCAO_VARIANT_WITH_IMAGE_CARDS,
} from "@/lib/landing-pages/variants";
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

        <Cards
          content={content}
          destaque={variant === SOLUCAO_VARIANT_CARDS_HIGHLIGHT}
        />
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
  cards uniformes (brancos com borda superior dourada) OU com destaque: no modo
  destaque, cartões pares (0, 2) ficam realçados na cor da marca, criando ritmo.
  Cards brancos funcionam tanto sobre fundo claro quanto escuro.
*/
function Cards({
  content,
  destaque,
}: {
  content: SolucaoContent;
  destaque: boolean;
}) {
  return (
    <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
      {content.cards.map((c, i) => {
        const hl = destaque && i % 2 === 0;
        return (
          <Reveal key={`${c.title}-${c.text}`} delay={i * 80}>
            <div
              className={`relative h-full overflow-hidden rounded-2xl p-7 shadow-lg transition hover:-translate-y-1 hover:shadow-xl ${
                hl
                  ? "bg-lp-brand text-white shadow-2xl shadow-lp-brand/30"
                  : "border-t-4 border-lp-accent bg-white"
              }`}
            >
              {hl ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lp-accent/15"
                />
              ) : null}
              <span
                className={`relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${
                  hl
                    ? "bg-lp-accent text-lp-brand-dark"
                    : "bg-lp-brand text-lp-accent-soft"
                }`}
              >
                <IconForKey iconKey={c.icon} size={28} />
              </span>
              <h3
                className={`relative font-display text-xl font-bold ${hl ? "text-white" : "text-lp-brand"}`}
              >
                {c.title}
              </h3>
              <p
                className={`relative mt-2 text-[1.05rem] leading-relaxed ${hl ? "text-white/80" : "text-lp-ink-soft"}`}
              >
                {c.text}
              </p>
              {hl ? (
                <p className="relative mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-lp-accent-soft">
                  {i === 0 ? "Onde tudo começa" : "Próximo passo"}
                </p>
              ) : null}
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
