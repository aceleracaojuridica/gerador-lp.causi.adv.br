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
  PlayArrowFill,
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
import { LogoMark } from "@/components/ui/logo-mark";
import {
  heroImageOverlay,
  heroStatsImageOverlay,
  thumbImageOverlay,
} from "@/lib/landing-pages/colors";
import type {
  HeroContent,
  HeroFeature,
  HeroVariant,
  Office,
  Tone,
} from "@/lib/landing-pages/schema";
import { focalPos } from "@/lib/landing-pages/schema";
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

type HeroProps = {
  content: HeroContent;
  office: Office;
  variant: HeroVariant;
  videoId?: string;
  accentRgb: string;
  brandRgb: string;
  brandDarkRgb: string;
  creamRgb: string;
  creamDeepRgb: string;
  tone: Tone;
  // Tom da seção logo abaixo do Hero — os mini-cards do tema centralizado
  // se sobrepõem a ela, então a sombra precisa adaptar (some em fundo escuro).
  belowTone?: Tone;
};

export function Hero(props: HeroProps) {
  switch (props.variant) {
    case "split":
      return <HeroSplit {...props} />;
    case "video":
      return <HeroVideo {...props} />;
    case "stats":
      return <HeroStats {...props} />;
    default:
      return <HeroCentered {...props} />;
  }
}

/* ===== Tema 3 — Centralizado + mini-cards =====
   Fundo casa com o fundo da logo. Se houver imagem da seção (enviada pelo
   usuário), ela entra como fundo com overlay; sem imagem, fica só a cor. */
function HeroCentered({
  content,
  office,
  accentRgb,
  brandDarkRgb,
  creamRgb,
  creamDeepRgb,
  tone,
  belowTone,
}: HeroProps) {
  const bg = office.logoBg;
  const logoDark = bg?.type === "dark";
  // Respeita sempre a escolha do usuário (Claro / Escuro).
  const dark = tone === "dark";
  const img = office.sectionImages.hero;

  let sectionStyle: React.CSSProperties | undefined;
  if (img) {
    const overlay = heroImageOverlay(
      dark,
      brandDarkRgb,
      creamRgb,
      creamDeepRgb,
    );
    sectionStyle = {
      backgroundImage: `${overlay}, url('${img}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  } else if (dark && logoDark && bg) {
    sectionStyle = { backgroundColor: bg.color };
  } else if (!dark && bg && bg.type !== "transparent" && !logoDark) {
    sectionStyle = { backgroundColor: bg.color };
  }

  // dark sem imagem e sem cor escura da logo → usa a classe bg-brand-dark.
  const useBrandDark = dark && !img && !logoDark;
  // light com logo de fundo escuro cai no cream (não usa a cor escura da logo).
  const useCream =
    !dark && !img && (!bg || bg.type === "transparent" || logoDark);
  const headlineCls = dark ? "text-white" : "text-brand";
  const subCls = dark ? "text-white/85" : "text-ink-soft";
  const eyebrowCls = dark ? "text-accent-soft" : "text-accent";
  const ringTone = dark ? "border-white/[0.08]" : "border-brand/[0.06]";

  // Mini-cards: usa os editados pelo usuário (heroFeatures) se houver; senão, os
  // destaques da copy gerada. Sem nenhum, a faixa some e o Hero fecha mais cedo.
  const features: HeroFeature[] = office.heroFeatures
    ? office.heroFeatures.filter((f) => f.text.trim())
    : content.features.map((f) => ({ icon: f.icon, text: f.title }));
  const hasCards = features.length > 0;

  return (
    <>
      <section
        className={`relative overflow-hidden ${useCream ? "bg-cream" : ""} ${useBrandDark ? "bg-brand-dark" : ""
          }`}
        style={sectionStyle}
      >
        <div
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[120vmin] w-[120vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringTone}`}
        />
        <div
          aria-hidden
          className={`pointer-events-none absolute left-1/2 top-1/2 h-[80vmin] w-[80vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border ${ringTone}`}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(${accentRgb},0.12), transparent 65%)`,
          }}
        />

        <div
          className={`relative mx-auto flex max-w-4xl flex-col items-center px-6 pt-16 text-center md:pt-20 ${hasCards ? "pb-36 md:pb-44" : "pb-16 md:pb-20"
            }`}
        >
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-10"
          />
          <p className={`eyebrow mb-5 ${eyebrowCls}`}>
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.1] md:text-6xl ${headlineCls}`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p className={`mt-6 max-w-2xl text-lg leading-relaxed ${subCls}`}>
            {content.sub}
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
            <CTAButton variant={dark ? "primary" : "accent"}>
              {content.ctaPrimary}
            </CTAButton>
            <CTAButton variant={dark ? "ghost" : "outline"} withArrow={false}>
              {content.ctaSecondary}
            </CTAButton>
          </div>
        </div>
      </section>

      {hasCards ? (
        <FeatureCards features={features} belowTone={belowTone} />
      ) : null}
    </>
  );
}

/* ===== Tema 1 — Split 50/50 (claro ou escuro) ===== */
function HeroSplit({ content, office, tone }: HeroProps) {
  const dark = tone === "dark";
  const img = office.sectionImages.hero;
  return (
    <section className="grid grid-cols-1 lg:grid-cols-2">
      <div
        className={`relative flex flex-col justify-center px-6 py-16 md:px-12 md:py-24 ${dark ? "bg-brand" : "bg-cream"
          }`}
      >
        <LogoMark
          office={office}
          tone={dark ? "light" : "dark"}
          className="mb-8 self-start"
        />
        <p
          className={`eyebrow mb-4 ${dark ? "text-accent-soft" : "text-accent"}`}
        >
          {content.eyebrow}
          {office.city ? ` · ${office.city}` : ""}
        </p>
        <h1
          className={`font-display text-4xl font-semibold leading-[1.1] md:text-5xl ${dark ? "text-white" : "text-brand"
            }`}
        >
          <HeadlineText
            h={content.headline}
            accentVar={dark ? "accent-soft" : "accent"}
          />
        </h1>
        <p
          className={`mt-6 max-w-lg text-lg leading-relaxed ${dark ? "text-white/80" : "text-ink-soft"
            }`}
        >
          {content.sub}
        </p>
        <div className="mt-9">
          <CTAButton variant={dark ? "primary" : "accent"}>
            {content.ctaPrimary}
          </CTAButton>
        </div>
      </div>
      {/* Coluna direita — imagem do usuário, ou bloco da marca (oculta no mobile) */}
      <div
        aria-hidden
        className="hidden min-h-[28rem] bg-brand-dark lg:block"
        style={
          img
            ? {
              backgroundImage: `url('${img}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
            : undefined
        }
      />
    </section>
  );
}

/* ===== Tema 2 — Vídeo + Foto (claro ou escuro) ===== */
function HeroVideo({
  content,
  office,
  videoId,
  tone,
  brandDarkRgb,
}: HeroProps) {
  const dark = tone === "dark";
  // Coluna direita é a foto do advogado; sem ela, cai na imagem de cenário.
  const img = office.lawyers[0]?.photo || office.sectionImages.hero;
  // Enquadramento do advogado (quando a imagem é a foto dele).
  const imgPos = office.lawyers[0]?.photo
    ? focalPos(office.lawyers[0].focal)
    : "center";
  const thumb = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : "";
  return (
    <section className={dark ? "bg-brand-dark" : "bg-cream"}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-[56%_44%] lg:gap-12 lg:py-20">
        <div>
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-7 self-start"
          />
          <p
            className={`eyebrow mb-4 ${dark ? "text-accent-soft" : "text-accent"}`}
          >
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.1] md:text-5xl ${dark ? "text-white" : "text-brand"
              }`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${dark ? "text-white/85" : "text-ink-soft"
              }`}
          >
            {content.sub}
          </p>

          {/* facade de vídeo (thumbnail do YouTube, ou bloco da marca) */}
          <a
            href={
              videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Assistir ao vídeo de apresentação"
            className="group relative mt-7 block aspect-video w-full max-w-xl overflow-hidden rounded-2xl bg-brand-dark shadow-lg"
            style={
              thumb
                ? {
                  backgroundImage: `${thumbImageOverlay(brandDarkRgb)}, url('${thumb}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
                : undefined
            }
          >
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-brand-dark shadow-xl transition group-hover:scale-110">
              <PlayArrowFill size={26} className="ml-1" />
            </span>
          </a>

          <div className="mt-7">
            <CTAButton variant={dark ? "primary" : "accent"}>
              {content.ctaPrimary}
            </CTAButton>
          </div>
        </div>

        {/* Imagem da seção (oculta no mobile) */}
        <div className="hidden lg:block">
          <div
            className="h-[34rem] w-full rounded-tl-[3rem] rounded-br-[3rem] bg-brand"
            style={
              img
                ? {
                  backgroundImage: `url('${img}')`,
                  backgroundSize: "cover",
                  backgroundPosition: imgPos,
                }
                : undefined
            }
          />
        </div>
      </div>
    </section>
  );
}

/* ===== Tema 4 — Hero com Stats (claro ou escuro) ===== */
function HeroStats({
  content,
  office,
  brandRgb,
  creamRgb,
  creamDeepRgb,
  tone,
}: HeroProps) {
  const dark = tone === "dark";
  // Card com borda dourada é a foto do advogado; sem ela, imagem de cenário.
  const img = office.lawyers[0]?.photo || office.sectionImages.hero;
  const imgPos = office.lawyers[0]?.photo
    ? focalPos(office.lawyers[0].focal)
    : "center";
  const hasMetrics = office.metrics.length > 0;

  // Foto de fundo da seção (cenário/escritório) com overlay — como no Hero
  // centralizado. Sem imagem, mantém só a cor (e o gradiente da marca no escuro).
  const bgImg = office.sectionImages.hero;
  let sectionStyle: React.CSSProperties | undefined;
  if (bgImg) {
    const overlay = heroStatsImageOverlay(
      dark,
      brandRgb,
      creamRgb,
      creamDeepRgb,
    );
    sectionStyle = {
      backgroundImage: `${overlay}, url('${bgImg}')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  } else if (dark) {
    sectionStyle = {
      backgroundImage: `linear-gradient(120deg, rgba(${brandRgb},0.97), rgba(${brandRgb},0.72))`,
    };
  }

  return (
    <section
      className={`relative overflow-hidden ${dark ? "bg-brand-dark" : "bg-cream"}`}
      style={sectionStyle}
    >
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 lg:grid-cols-[58%_42%] lg:py-24">
        <div>
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-7 self-start"
          />
          <p
            className={`eyebrow mb-4 ${dark ? "text-accent-soft" : "text-accent"}`}
          >
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.12] md:text-5xl ${dark ? "text-white" : "text-brand"
              }`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${dark ? "text-white/85" : "text-ink-soft"
              }`}
          >
            {content.sub}
          </p>
          <div className="mt-8">
            <CTAButton variant={dark ? "primary" : "accent"}>
              {content.ctaPrimary}
            </CTAButton>
          </div>

          {hasMetrics ? (
            <div
              className={`mt-10 flex flex-wrap gap-8 border-t pt-7 ${dark ? "border-white/15" : "border-ink-soft/15"
                }`}
            >
              {office.metrics.slice(0, 3).map((m, i) => {
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className={dark ? "text-accent-soft" : "text-accent"}>
                      <IconForKey iconKey={m.icon} size={32} />
                    </span>
                    <p
                      className={`max-w-[12rem] text-sm leading-snug ${dark ? "text-white/80" : "text-ink-soft"
                        }`}
                    >
                      {m.label}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Card de imagem com borda dourada (oculto no mobile) */}
        <div className="hidden justify-self-end lg:block">
          <div className="border-4 border-accent p-2">
            <div
              className="h-[30rem] w-72 bg-brand"
              style={
                img
                  ? {
                    backgroundImage: `url('${img}')`,
                    backgroundSize: "cover",
                    backgroundPosition: imgPos,
                  }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* mini-cards de feature sobrepostos (usados no tema centralizado) */
function FeatureCards({
  features,
  belowTone,
}: {
  features: HeroFeature[];
  belowTone?: Tone;
}) {
  // Os cards descem por cima da seção seguinte. Em fundo claro, a sombra
  // azul-marinho suave (shadow-brand/10) lê bem; em fundo escuro ela some, então
  // usa-se uma sombra preta mais forte + um leve halo branco para destacar.
  const cardShadow =
    belowTone === "dark"
      ? "shadow-2xl shadow-black/40 ring-1 ring-white/10"
      : "shadow-xl shadow-brand/10 ring-1 ring-ink-soft/5";
  // A grade acompanha a quantidade de cards (1 a 3) para ficar sempre centrada.
  const widthCls =
    features.length >= 3
      ? "max-w-6xl"
      : features.length === 2
        ? "md:max-w-3xl"
        : "md:max-w-md";
  const colsCls =
    features.length >= 3
      ? "md:grid-cols-3"
      : features.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1";
  return (
    <div className={`relative z-20 mx-auto -mt-24 px-6 md:-mt-28 ${widthCls}`}>
      <div className={`grid grid-cols-1 gap-4 md:gap-6 ${colsCls}`}>
        {features.map((f, i) => {
          return (
            <div
              key={i}
              className={`flex items-center gap-4 rounded-2xl bg-white p-6 ${cardShadow}`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand text-accent-soft">
                <IconForKey iconKey={f.icon} size={26} />
              </span>
              <p className="font-display text-base font-semibold leading-snug text-brand">
                {f.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
