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
import { Fragment } from "react";
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
import {
  HERO_VARIANT_CUTOUT_PORTRAIT as HERO_CUTOUT_PORTRAIT_ID,
  HERO_VARIANT_SPLIT_MEDIA as HERO_SPLIT_MEDIA_ID,
  HERO_VARIANT_STATS_AUTHORITY as HERO_STATS_AUTHORITY_ID,
  HERO_VARIANT_VIDEO_EMBEDDED as HERO_VIDEO_EMBEDDED_ID,
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
  // 2º botão do Hero (variações com dois botões): âncora interna para uma seção
  // da página (áreas de atuação; ou Sobre, se áreas estiver oculta).
  anchorCta?: { label: string; href: string };
};

/** Faixa de destaques do Hero: 2 a 4 itens. */
export const HERO_BAND_MIN_ITEMS = 2;
export const HERO_BAND_MAX_ITEMS = 4;

/**
 * Itens da faixa de destaques: usa os editados pelo usuário (heroFeatures) se
 * houver; senão, os destaques da copy gerada. Corta no máximo permitido — com
 * menos que o mínimo a faixa não faz sentido e some.
 */
function bandFeatures(office: Office, content: HeroContent): HeroFeature[] {
  return (
    office.heroFeatures
      ? office.heroFeatures.filter((f) => f.text.trim())
      : content.features.map((f) => ({ icon: f.icon, text: f.title }))
  ).slice(0, HERO_BAND_MAX_ITEMS);
}

export function Hero(props: HeroProps) {
  switch (props.variant) {
    case HERO_SPLIT_MEDIA_ID:
      return <HeroSplit {...props} />;
    case HERO_VIDEO_EMBEDDED_ID:
      return <HeroVideo {...props} />;
    case HERO_STATS_AUTHORITY_ID:
      return <HeroStats {...props} />;
    case HERO_CUTOUT_PORTRAIT_ID:
      return <HeroRecorte {...props} />;
    default:
      return <HeroCentered {...props} />;
  }
}

/* ===== Tema 3 — Centralizado + faixa de destaques =====
   Fundo casa com o fundo da logo. Se houver imagem da seção (enviada pelo
   usuário), ela entra como fundo com overlay; sem imagem, fica só a cor.
   Na base da seção, uma faixa com 2 a 4 destaques em caixa alta. */
function HeroCentered({
  content,
  office,
  accentRgb,
  brandRgb,
  creamRgb,
  creamDeepRgb,
  tone,
  anchorCta,
}: HeroProps) {
  const bg = office.logoBg;
  const logoDark = bg?.type === "dark";
  // Respeita sempre a escolha do usuário (Claro / Escuro).
  const dark = tone === "dark";
  const img = office.sectionImages.hero;

  let sectionStyle: React.CSSProperties | undefined;
  if (img) {
    const overlay = heroImageOverlay(dark, brandRgb, creamRgb, creamDeepRgb);
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

  // dark sem imagem e sem cor escura da logo → usa a classe bg-lp-brand-dark.
  const useBrandDark = dark && !img && !logoDark;
  // light com logo de fundo escuro cai no cream (não usa a cor escura da logo).
  const useCream =
    !dark && !img && (!bg || bg.type === "transparent" || logoDark);
  const headlineCls = dark ? "text-white" : "text-lp-brand";
  const subCls = dark ? "text-white/85" : "text-lp-ink-soft";
  const eyebrowCls = dark ? "text-lp-accent-soft" : "text-lp-accent";
  const ringTone = dark ? "border-white/[0.08]" : "border-lp-brand/[0.06]";

  const features = bandFeatures(office, content);
  const hasBand = features.length >= HERO_BAND_MIN_ITEMS;

  return (
    <section
      className={`relative flex min-h-svh flex-col overflow-hidden ${
        useCream ? "bg-lp-cream" : ""
      } ${useBrandDark ? "bg-lp-brand-dark" : ""}`}
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

      <div className="relative mx-auto flex max-w-4xl flex-1 flex-col items-center justify-center px-6 py-16 text-center md:py-20">
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
          <CTAButton
            variant={dark ? "ghost" : "outline"}
            withArrow={false}
            anchor={anchorCta?.href}
          >
            {anchorCta?.label ?? content.ctaSecondary}
          </CTAButton>
        </div>
      </div>

      {/* Faixa de destaques colada na base da seção */}
      {hasBand ? <FeatureBand features={features} /> : null}
    </section>
  );
}

/* ===== Tema 1 — Split 50/50 (claro ou escuro) ===== */
function HeroSplit({ content, office, tone }: HeroProps) {
  const dark = tone === "dark";
  const img = office.sectionImages.hero;
  return (
    <section className="grid min-h-svh grid-cols-1 lg:grid-cols-2">
      <div
        className={`relative flex flex-col justify-center px-6 py-16 md:px-12 md:py-24 ${
          dark ? "bg-lp-brand" : "bg-lp-cream"
        }`}
      >
        <LogoMark
          office={office}
          tone={dark ? "light" : "dark"}
          className="mb-8 self-start"
        />
        <p
          className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
        >
          {content.eyebrow}
          {office.city ? ` · ${office.city}` : ""}
        </p>
        <h1
          className={`font-display text-4xl font-semibold leading-[1.1] md:text-5xl ${
            dark ? "text-white" : "text-lp-brand"
          }`}
        >
          <HeadlineText
            h={content.headline}
            accentVar={dark ? "accent-soft" : "accent"}
          />
        </h1>
        <p
          className={`mt-6 max-w-lg text-lg leading-relaxed ${
            dark ? "text-white/80" : "text-lp-ink-soft"
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
        className="hidden min-h-[28rem] bg-lp-brand-dark lg:block"
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
    <section
      className={`flex min-h-svh flex-col ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[56%_44%] lg:gap-12 lg:py-16">
        <div>
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-7 self-start"
          />
          <p
            className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.1] md:text-5xl ${
              dark ? "text-white" : "text-lp-brand"
            }`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${
              dark ? "text-white/85" : "text-lp-ink-soft"
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
            // max-h em vh: em telas baixas o player encolhe (a thumb é bg-cover,
            // então só recorta) em vez de empurrar a seção para fora da tela.
            className="group relative mt-6 block aspect-video max-h-[28vh] w-full max-w-xl overflow-hidden rounded-2xl bg-lp-brand-dark shadow-lg"
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
            <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-lp-accent text-lp-brand-dark shadow-xl transition group-hover:scale-110">
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
            className="h-[34rem] max-h-[70vh] w-full rounded-tl-[var(--lp-corner)] rounded-br-[var(--lp-corner)] bg-lp-brand"
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
  // Foto recortada do advogado, sobreposta à direita (sem moldura). Sem foto,
  // o hero fica só com o texto sobre o fundo (cena/cor).
  const lawyer = office.lawyers[0]?.photo;
  const hasMetrics = office.metrics.length > 0;
  const features = bandFeatures(office, content);
  const hasBand = features.length >= HERO_BAND_MIN_ITEMS;

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
      className={`relative flex min-h-svh flex-col overflow-hidden ${
        dark ? "bg-lp-brand-dark" : "bg-lp-cream"
      }`}
      style={sectionStyle}
    >
      <div className="relative mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-10 px-6 py-12 md:px-10 lg:grid-cols-[58%_42%] lg:py-16">
        <div>
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-7 self-start"
          />
          <p
            className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.12] md:text-5xl ${
              dark ? "text-white" : "text-lp-brand"
            }`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${
              dark ? "text-white/85" : "text-lp-ink-soft"
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
              className={`mt-10 flex flex-wrap gap-8 border-t pt-7 ${
                dark ? "border-white/15" : "border-lp-ink-soft/15"
              }`}
            >
              {office.metrics.slice(0, 3).map((m) => {
                return (
                  <div key={m.label} className="flex items-center gap-3">
                    <span
                      className={
                        dark ? "text-lp-accent-soft" : "text-lp-accent"
                      }
                    >
                      <IconForKey iconKey={m.icon} size={32} />
                    </span>
                    <p
                      className={`max-w-[12rem] text-sm leading-snug ${
                        dark ? "text-white/80" : "text-lp-ink-soft"
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

        {/* Foto recortada sobreposta, ancorada na base — sem moldura (oculta no mobile) */}
        <div className="relative hidden items-end justify-center self-stretch lg:flex">
          {lawyer ? (
            // biome-ignore lint/performance/noImgElement: recorte precisa de object-contain + máscara de fade
            <img
              src={lawyer}
              alt={office.lawyers[0]?.name || office.name}
              className="relative z-10 h-full max-h-[min(34rem,70vh)] w-auto self-end object-contain object-bottom"
              style={{
                maskImage:
                  "linear-gradient(to bottom, #000 88%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, #000 88%, transparent 100%)",
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Faixa de destaques colada na base da seção */}
      {hasBand ? <FeatureBand features={features} /> : null}
    </section>
  );
}

/* ===== Tema 5 — Recorte =====
   Fundo = cena da seção (sectionImages.hero) em object-cover + degradê escuro
   forte da esquerda p/ direita (texto legível à esquerda, cena visível à direita).
   Foto do advogado (idealmente PNG sem fundo) recortada à direita, ancorada na
   base, com máscara de fade + "fumaça" que a dissolve no fundo. Premium/autoridade. */
function HeroRecorte({
  content,
  office,
  tone,
  creamRgb,
  brandDarkRgb,
  anchorCta,
}: HeroProps) {
  const lawyer = office.lawyers[0]?.photo;
  const bgImg = office.sectionImages.hero;
  const hasMetrics = office.metrics.length > 0;
  const dark = tone === "dark";
  // Cor base dos gradientes (overlay, transição e fumaça): escuro usa a marca,
  // claro usa o creme para o texto ficar legível sobre a cena.
  const baseRgb = dark ? brandDarkRgb : creamRgb;

  return (
    <section
      className={`relative flex min-h-svh overflow-hidden ${
        dark ? "bg-lp-brand-dark text-white" : "bg-lp-cream text-lp-brand"
      }`}
    >
      {/* Cena de fundo cobrindo a seção (sem blur) */}
      {bgImg ? (
        // biome-ignore lint/performance/noImgElement: fundo precisa cobrir a seção com object-position custom
        <img
          src={bgImg}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[62%_center] lg:scale-110"
        />
      ) : null}
      {/* Overlay: sólido à esquerda (texto), leve à direita (mostra a cena atrás da foto) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(${baseRgb},1) 0%, rgba(${baseRgb},0.92) 45%, rgba(${baseRgb},0.6) 100%)`,
        }}
      />
      {/* Transição suave para a próxima seção */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(${baseRgb},1), rgba(${baseRgb},0.8) 40%, transparent)`,
        }}
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-stretch gap-10 px-6 md:px-10 lg:grid-cols-2">
        <div className="flex flex-col justify-center py-16 lg:py-20">
          <LogoMark
            office={office}
            tone={dark ? "light" : "dark"}
            className="mb-6 self-start"
          />
          <p
            className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {content.eyebrow}
            {office.city ? ` · ${office.city}` : ""}
          </p>
          <h1
            className={`font-display text-4xl font-semibold leading-[1.08] md:text-5xl ${
              dark ? "text-white" : "text-lp-brand"
            }`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h1>
          <p
            className={`mt-5 max-w-xl text-lg leading-relaxed ${
              dark ? "text-white/80" : "text-lp-ink-soft"
            }`}
          >
            {content.sub}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CTAButton variant={dark ? "white" : "accent"}>
              {content.ctaPrimary}
            </CTAButton>
            {content.ctaSecondary ? (
              <CTAButton
                variant={dark ? "ghost" : "outline"}
                withArrow={false}
                anchor={anchorCta?.href}
              >
                {anchorCta?.label ?? content.ctaSecondary}
              </CTAButton>
            ) : null}
          </div>

          {hasMetrics ? (
            <div
              className={`mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t pt-7 ${
                dark ? "border-white/15" : "border-lp-ink-soft/15"
              }`}
            >
              {office.metrics.slice(0, 4).map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span
                    className={dark ? "text-lp-accent-soft" : "text-lp-accent"}
                  >
                    <IconForKey iconKey={m.icon} size={28} />
                  </span>
                  <p
                    className={`max-w-[11rem] text-sm leading-snug ${
                      dark ? "text-white/75" : "text-lp-ink-soft"
                    }`}
                  >
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Foto recortada, ancorada na base, dissolvendo no fundo (máscara + fumaça) */}
        <div className="relative hidden items-end justify-end lg:flex">
          {lawyer ? (
            <div className="relative flex h-full items-end justify-end self-stretch">
              {/* biome-ignore lint/performance/noImgElement: recorte precisa de object-contain + máscara */}
              <img
                src={lawyer}
                alt={office.lawyers[0]?.name || office.name}
                className="relative z-10 h-full w-auto self-end object-contain object-bottom"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, #000 68%, transparent 95%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, #000 68%, transparent 95%)",
                }}
              />
              {/* Fumaça na base que dissolve a foto no fundo */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-[-20%] bottom-0 h-3/5 blur-3xl"
                style={{
                  backgroundImage: `radial-gradient(120% 95% at 50% 100%, rgba(${baseRgb},0.95), rgba(${baseRgb},0.6) 55%, transparent 82%)`,
                }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* Faixa de destaques na base do Hero centralizado: texto em caixa alta separado
   por um losango, sobre a cor da marca. Sem cards e sem ícones. */
function FeatureBand({ features }: { features: HeroFeature[] }) {
  return (
    <div className="relative w-full bg-lp-brand">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-5 gap-y-1.5 px-6 py-3.5 md:gap-x-9 md:px-10">
        {features.map((f, i) => (
          <Fragment key={`${f.icon}-${f.text}`}>
            {i > 0 ? (
              <span
                aria-hidden
                className="text-[0.6rem] text-lp-accent-soft md:text-xs"
              >
                &#10022;
              </span>
            ) : null}
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/90 md:text-xs">
              {f.text}
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
