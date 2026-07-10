import type { PopupQuestion } from "../popup/types";
import type {
  AreasVariant,
  DorVariant,
  EquipeVariant,
  EtapasVariant,
  HeroVariant,
  SobreVariant,
  SolucaoVariant,
} from "../variants";

/*
  Tipos do schema da Landing Page — contrato serializável (JSON).
  Defaults em ./defaults.ts; helpers (focalPos, waLink, themeToCssVars) em ./helpers.ts.
*/

export type Theme = {
  brand: string;
  brandDark: string;
  accent: string;
  accentSoft: string;
  cream: string;
  creamDeep: string;
  ink: string;
  inkSoft: string;
};

export type Metric = { icon: string; label: string };
export type HeroFeature = { icon: string; text: string };

export type Lawyer = {
  photo: string;
  name: string;
  role: string;
  focal?: { x: number; y: number };
};

export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "linkedin";
export type Social = { network: SocialNetwork; url: string };

export type ConversionTags = { head: string; body: string; footer: string };

export type Ga4Tracking = { enabled: boolean; measurementId: string };
export type GtmTracking = { enabled: boolean; containerId: string };
export type MetaPixelTracking = { enabled: boolean; pixelId: string };
export type GoogleAdsTracking = {
  enabled: boolean;
  adsId: string;
  conversionLabel: string;
};

export type TrackingProviderConfig = {
  ga4: Ga4Tracking;
  gtm: GtmTracking;
  metaPixel: MetaPixelTracking;
  googleAds: GoogleAdsTracking;
};
export type CustomCard = { title: string; text: string };

export type {
  PopupCurrency,
  PopupQuestion,
  PopupQuestionBase,
  PopupQuestionType,
} from "../popup/types";

export type Tone = "light" | "dark";

export type CustomSection = {
  id: string;
  kind: "cards" | "texto";
  tone: Tone;
  eyebrow: string;
  title: string;
  text: string;
  cards: CustomCard[];
};

export type ExtraAddress = { address: string; city: string; mapsUrl: string };
export type ExtraContact = {
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
};

export type Office = {
  name: string;
  fullName: string;
  product: string;
  area: string;
  city: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  address: string;
  mapsUrl: string;
  extraAddresses?: ExtraAddress[];
  extraContacts?: ExtraContact[];
  tags?: ConversionTags;
  tracking?: TrackingProviderConfig;
  privacyPolicy?: string;
  fonts?: { heading: string; body: string };
  cardRadius?: "rounded" | "square";
  buttons?: {
    radius: "rounded" | "square";
    action: "whatsapp" | "link" | "popup";
    link: string;
    popup?: {
      questions: PopupQuestion[];
    };
  };
  about: string;
  diferenciais: string[];
  logoSrc: string;
  logoBg: { type: "transparent" | "light" | "dark"; color: string };
  lawyers: Lawyer[];
  socials: Social[];
  sectionImages: { hero: string; dor: string; sobre: string; solucao: string };
  metrics: Metric[];
  heroFeatures?: HeroFeature[];
};

export type SectionImageKey = "hero" | "dor" | "sobre" | "solucao";
export type Headline = { pre: string; em: string; post: string };
export type IconCard = { icon: string; title: string; text: string };

export type HeroContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  features: IconCard[];
};

export type DorContent = {
  eyebrow: string;
  headline: Headline;
  intro: string;
  cards: IconCard[];
};

export type SolucaoContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  cards: IconCard[];
};

export type AreasContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  cards: IconCard[];
  cta: string;
};

export type CtaFinalContent = {
  headline: Headline;
  sub: string;
  cta: string;
};

export type FaqItem = { q: string; a: string };
export type FaqContent = {
  eyebrow: string;
  headline: Headline;
  items: FaqItem[];
};

export type EtapaItem = { title: string; text: string };
export type EtapasContent = {
  eyebrow: string;
  headline: Headline;
  steps: EtapaItem[];
};

export type {
  AreasVariant,
  DorVariant,
  EquipeVariant,
  EtapasVariant,
  HeroVariant,
  SobreVariant,
  SolucaoVariant,
} from "../variants";

export type SectionTones = {
  hero: Tone;
  dor: Tone;
  solucao: Tone;
  sobre: Tone;
  equipe: Tone;
  areas: Tone;
  etapas: Tone;
  faq: Tone;
  ctaFinal: Tone;
};

export type ToggleableSection =
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "equipe";

export type Layout = {
  hero: HeroVariant;
  dor: DorVariant;
  solucao: SolucaoVariant;
  sobre: SobreVariant;
  equipe?: EquipeVariant;
  areas: AreasVariant;
  etapas: EtapasVariant;
  tones: SectionTones;
  hidden?: Partial<Record<ToggleableSection, boolean>>;
  order?: string[];
};

export type SeoMeta = {
  title: string;
  description: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  favicon?: string;
  keywords?: string;
  siteName?: string;
  canonicalUrl?: string;
  indexable?: boolean;
};

export type LpSchema = {
  theme: Theme;
  office: Office;
  layout: Layout;
  videoId?: string;
  hero: HeroContent;
  dor: DorContent;
  solucao: SolucaoContent;
  areas: AreasContent;
  etapas: EtapasContent;
  faq: FaqContent;
  ctaFinal: CtaFinalContent;
  seo?: SeoMeta;
  customSections?: CustomSection[];
};

export type StoredLp = {
  slug: string;
  officeSubdomain: string;
  name: string;
  tema: string;
  status?: "draft" | "published";
  schema: LpSchema;
};
