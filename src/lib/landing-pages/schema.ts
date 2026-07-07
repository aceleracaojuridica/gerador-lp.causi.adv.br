import type {
  AreasVariant,
  DorVariant,
  EquipeVariant,
  EtapasVariant,
  HeroVariant,
  SobreVariant,
  SolucaoVariant,
} from "./variants";
import {
  AREAS_VARIANT_GRID_ICON_CARDS,
  DOR_VARIANT_WITH_IMAGE_CARDS,
  ETAPAS_VARIANT_NUMBERED_STEPS,
  HERO_VARIANT_CENTERED_FOCUS,
  SOBRE_VARIANT_PHOTO_LIST,
  SOLUCAO_VARIANT_CARDS_COMPACT,
} from "./variants";

/*
  Schema da Landing Page — o contrato único do projeto.

  O formulário preenche `theme` e `office` (fatos de identidade, instantâneos).
  A copy das seções (`hero`, `dor`, ...) é preenchida por mock agora e, na
  fase 3, pela IA (API Claude) a partir do foco jurídico escolhido.

  Tudo aqui é serializável (JSON): nada de componentes/ícones embutidos —
  ícones são referenciados por chave de string e resolvidos em lib/icons.ts.
  Esse mesmo JSON poderá, no futuro, alimentar a geração de código do deploy.
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

/** Destaque do Hero "Com métricas": ícone + texto curto (ex: "anos de atuação"). */
export type Metric = { icon: string; label: string };

/** Mini-card de destaque do Hero centralizado: ícone + texto curto. Opcional. */
export type HeroFeature = { icon: string; text: string };

/**
 * Advogado/sócio: foto (data URL) + nome + função. 1 = solo; 2+ = equipe.
 * `focal` é o ponto de enquadramento da foto (% x/y, padrão 50/50) — usado como
 * background-position para o rosto não ser cortado nos blocos "cover".
 */
export type Lawyer = {
  photo: string; // URL pública no Storage ou data URL em preview
  name: string;
  role: string;
  focal?: { x: number; y: number };
};

/** Posição de enquadramento de uma foto (background-position), padrão centro. */
export function focalPos(focal?: { x: number; y: number }): string {
  return focal ? `${focal.x}% ${focal.y}%` : "center";
}

/** Redes sociais (ícone + link) exibidas no rodapé. */
export type SocialNetwork =
  | "instagram"
  | "facebook"
  | "youtube"
  | "tiktok"
  | "linkedin";
export type Social = { network: SocialNetwork; url: string };

/** Scripts/tags de conversão injetados na página publicada (GTM, Pixel, gtag). */
export type ConversionTags = { head: string; body: string; footer: string };

/** IDs/configuração estruturada dos provedores de tracking suportados. */
export type TrackingProviderConfig = {
  ga4MeasurementId: string;
  gtmContainerId: string;
  metaPixelId: string;
  googleAdsId: string;
  googleAdsLabel: string;
};

/** Configuração pública do captcha exibido no formulário da LP. */
export type CaptchaConfig = {
  provider: "none" | "turnstile";
  siteKey: string;
  widgetTheme: "auto" | "light" | "dark";
};

/** Card simples de uma seção personalizada (sem ícone — numeração automática). */
export type CustomCard = { title: string; text: string };

/**
 * Pergunta do popup de lead personalizado. "text" = campo livre; "choice" =
 * opções clicáveis. O popup sempre termina com nome + telefone (fixos).
 */
export type PopupQuestion = {
  id: string;
  label: string;
  type: "text" | "choice";
  options: string[]; // usado só em "choice"
};

/**
 * Seção criada pelo usuário no editor. Formatos: "cards" (grade numerada),
 * "texto" (bloco de escrita), "youtube" (vídeo), "calendar" (agendamento
 * Google Calendar incorporado) e "maps" (mapa Google Maps incorporado).
 * Sempre com tom claro ou escuro.
 */
export type CustomSection = {
  id: string;
  kind: "cards" | "texto" | "youtube" | "calendar" | "maps";
  tone: Tone;
  eyebrow: string;
  title: string;
  text: string; // usado no formato "texto" (parágrafos separados por linha)
  cards: CustomCard[]; // usado no formato "cards"
  youtubeId?: string; // usado no formato "youtube"
  calendarUrl?: string; // usado no formato "calendar" (src do iframe do Google Calendar)
  mapsUrl?: string; // usado no formato "maps" (src do iframe do Google Maps)
  variant?: "boxed" | "fullWidth"; // variação visual para youtube, calendar e maps
};

/** Endereço adicional no rodapé (além do principal). */
export type ExtraAddress = { address: string; city: string; mapsUrl: string };
/** Contato adicional no rodapé (além do principal): telefone + e-mail. */
export type ExtraContact = {
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
};

export type Office = {
  name: string;
  fullName: string;
  product: string; // produto jurídico principal (ex: "Direito Trabalhista")
  area: string; // área de atuação (ex: "Direito do Trabalho")
  city: string;
  whatsapp: string; // somente dígitos
  whatsappDisplay: string;
  email: string;
  address: string; // endereço (multi-linha) exibido no rodapé
  mapsUrl: string; // link do Google Maps (opcional) — gera o link "Ver mais" no rodapé
  // Endereços/contatos adicionais (opcionais) — o principal acima é sempre o 1º.
  // Opcionais p/ compatibilidade com LPs salvas antes deste campo existir.
  extraAddresses?: ExtraAddress[];
  extraContacts?: ExtraContact[];
  // Configurações técnicas (painel "Configurações" do editor). Opcionais p/
  // compatibilidade com LPs salvas antes desses campos.
  tags?: ConversionTags; // scripts no <head>, início do <body> e rodapé
  tracking?: TrackingProviderConfig; // ids de GA4, GTM, Meta Pixel e Google Ads
  captcha?: CaptchaConfig; // config pública do Turnstile/captcha da LP
  privacyPolicy?: string; // texto da Política de Privacidade (link no rodapé)
  // Tipografia escolhida no editor (ids de lib/fonts). "" = padrão do site.
  fonts?: { heading: string; body: string };
  // Cantos dos cards da LP: "rounded" (padrão ~1rem) ou "square" (5px).
  cardRadius?: "rounded" | "square";
  // Botões de CTA da LP: cantos + ação ao clicar.
  // - whatsapp: abre o WhatsApp do rodapé
  // - link: abre uma URL externa
  // - popup: abre o popup de lead (perguntas personalizadas + nome/telefone)
  buttons?: {
    radius: "rounded" | "square";
    action: "whatsapp" | "link" | "popup";
    link: string;
    popup?: {
      questions: PopupQuestion[];
      email?: { enabled: boolean; required: boolean };
    };
  };
  about: string; // texto "sobre o escritório" (fornecido pelo usuário)
  diferenciais: string[]; // pontos fortes (opcional) — exibidos na seção Sobre
  logoSrc: string; // URL pública no Supabase Storage (ou data URL em preview)
  // Fundo da logo (transparente/claro/escuro) — casa o fundo da hero com a logo.
  logoBg: { type: "transparent" | "light" | "dark"; color: string };
  // Advogados/sócios (uploads do usuário). 1 = solo (foto no Sobre + card do
  // Hero); 2+ = equipe (renderiza a seção Equipe). Onde aparece uma pessoa.
  lawyers: Lawyer[];
  // Redes sociais (só as preenchidas) — exibidas no rodapé com ícone.
  socials: Social[];
  // Imagens de CENÁRIO por seção (Storage, Unsplash ou upload do usuário).
  sectionImages: { hero: string; dor: string; sobre: string; solucao: string };
  metrics: Metric[]; // destaques do Hero "Com métricas" (opcional) — ex: { icon: "trophy", label: "anos de atuação" }
  // Mini-cards de destaque do Hero centralizado (ícone + texto). Opcional p/
  // compatibilidade: ausente = usa os destaques da copy gerada; vazio = sem cards.
  heroFeatures?: HeroFeature[];
};

export type SectionImageKey = "hero" | "dor" | "sobre" | "solucao";

/** Texto de manchete com um trecho em destaque (cor accent). */
export type Headline = { pre: string; em: string; post: string };

/** Card genérico com ícone (chave de string), título e texto. */
export type IconCard = { icon: string; title: string; text: string };

export type HeroContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  ctaPrimary: string;
  ctaSecondary: string;
  features: IconCard[]; // 3 mini-cards sobrepostos
};

export type DorContent = {
  eyebrow: string;
  headline: Headline;
  intro: string;
  cards: IconCard[]; // 3 dores
};

export type SolucaoContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  cards: IconCard[]; // 4 etapas
};

export type AreasContent = {
  eyebrow: string;
  headline: Headline;
  sub: string;
  cards: IconCard[]; // 4 áreas
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

/** Etapas do atendimento: passos numerados (título + texto curto). */
export type EtapaItem = { title: string; text: string };
export type EtapasContent = {
  eyebrow: string;
  headline: Headline;
  steps: EtapaItem[]; // 4 etapas
};

export type {
  AreasVariant,
  DorVariant,
  EquipeVariant,
  EtapasVariant,
  HeroVariant,
  SobreVariant,
  SolucaoVariant,
} from "./variants";

/** Tom de fundo de uma seção: claro (cream/branco) ou escuro (cor da marca). */
export type Tone = "light" | "dark";

/**
 * Seções com toggle claro/escuro. Hero é regido pela logo; Dor pelo variant
 * clara/escura; Sobre pelas suas variantes de layout (overlay = escura).
 */
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

/** Seções não obrigatórias que podem ser ligadas/desligadas pela chave. */
export type ToggleableSection =
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "equipe";

/**
 * Variações ativas por seção — fonte da verdade para render (editor e site publicado).
 * Ver docs/guides/templates-vs-variants.md
 */
export type Layout = {
  hero: HeroVariant;
  dor: DorVariant;
  solucao: SolucaoVariant;
  sobre: SobreVariant;
  // Sem valor: mantém o auto apenas para 2+ advogados. O caso solo exige
  // escolha explícita da variant própria no editor.
  equipe?: EquipeVariant;
  areas: AreasVariant;
  etapas: EtapasVariant;
  tones: SectionTones;
  // Seções ocultadas pelo usuário (ausente/false = visível). Opcional p/
  // compatibilidade com LPs salvas antes da chave de seção.
  hidden?: Partial<Record<ToggleableSection, boolean>>;
  // Ordem das seções do meio (Hero/FAQ/Rodapé são fixos). Itens são chaves
  // ("dor", "areas"...) ou "custom:<id>". Ausente = ordem padrão.
  order?: string[];
};

export const DEFAULT_LAYOUT: Layout = {
  hero: HERO_VARIANT_CENTERED_FOCUS,
  dor: DOR_VARIANT_WITH_IMAGE_CARDS,
  solucao: SOLUCAO_VARIANT_CARDS_COMPACT,
  sobre: SOBRE_VARIANT_PHOTO_LIST,
  areas: AREAS_VARIANT_GRID_ICON_CARDS,
  etapas: ETAPAS_VARIANT_NUMBERED_STEPS,
  // Default preserva a alternância atual de fundos.
  tones: {
    hero: "light",
    dor: "light",
    solucao: "dark",
    sobre: "light",
    equipe: "light",
    areas: "dark",
    etapas: "light",
    faq: "light",
    ctaFinal: "dark",
  },
  // CTA "Fale conosco" desativado por padrão.
  hidden: { ctaFinal: true },
};

/**
 * Metadados de SEO e compartilhamento (Google Ads, Meta Ads, busca).
 * Campos opcionais usam fallbacks automáticos (hero, logo, copy).
 */
export type SeoMeta = {
  title: string; // 50–60 chars — keyword do tema + " | " + nome do escritório
  description: string; // 140–155 chars — benefício concreto + CTA suave
  /** Imagem de preview (Open Graph / Meta). Recomendado 1200×630 px. */
  ogImage?: string;
  /** Título nas redes; vazio = usa `title`. */
  ogTitle?: string;
  /** Descrição nas redes; vazio = usa `description`. */
  ogDescription?: string;
  /** Favicon / ícone do navegador; vazio = usa a logo. */
  favicon?: string;
  /** Palavras-chave separadas por vírgula (opcional). */
  keywords?: string;
  /** Nome do site para og:site_name; vazio = nome do escritório. */
  siteName?: string;
  /** URL canônica; vazio = URL pública automática. */
  canonicalUrl?: string;
  /** false = noindex (padrão para LPs de tráfego pago). */
  indexable?: boolean;
};

export type LpSchema = {
  theme: Theme;
  office: Office;
  layout: Layout;
  videoId?: string; // id do YouTube (opcional) — usado no hero com vídeo
  hero: HeroContent;
  dor: DorContent;
  solucao: SolucaoContent;
  areas: AreasContent;
  etapas: EtapasContent;
  faq: FaqContent;
  ctaFinal: CtaFinalContent;
  // Metadados SEO gerados pela IA. Opcional p/ compatibilidade com LPs antigas.
  seo?: SeoMeta;
  // Seções extras criadas pelo usuário (renderizadas antes do FAQ). Opcional
  // p/ compatibilidade com LPs salvas antes deste recurso.
  customSections?: CustomSection[];
};

/**
 * Uma LP gerada e salva. O frontend exibe e edita; o banco persiste.
 */
export type StoredLp = {
  slug: string; // identificador da LP por conta (kebab-case do tema)
  officeSubdomain: string; // subdomínio fixo do escritório (nome da conta)
  name: string; // nome do escritório/cliente (exibido na galeria)
  tema: string; // tema da LP (referência; não regera nada)
  status?: "draft" | "published"; // draft = só no editor; published = acessível publicamente
  schema: LpSchema; // o schema completo, pronto para renderizar
};

/** Tema default (paleta institucional sóbria) usado antes de extrair da logo. */
export const DEFAULT_THEME: Theme = {
  brand: "#1b2a4a",
  brandDark: "#111a30",
  accent: "#c79a3f",
  accentSoft: "#e6c87c",
  cream: "#faf7f1",
  creamDeep: "#efe6d6",
  ink: "#1b2536",
  inkSoft: "#59647b",
};

// Cor de texto que CONTRASTA com o accent (para botões com fundo accent):
// branco se o accent for escuro (azul, petróleo, bordô), escuro se for claro
// (dourado, caramelo). Evita texto escuro ilegível sobre accent escuro.
function accentInk(hex: string): string {
  const h = hex.replace("#", "");
  const f =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(f, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? "#ffffff" : "#111a1a";
}

/** Converte um Theme nas variáveis CSS que os componentes consomem. */
export function themeToCssVars(t: Theme): React.CSSProperties {
  return {
    "--lp-brand": t.brand,
    "--lp-brand-dark": t.brandDark,
    "--lp-accent": t.accent,
    "--lp-accent-soft": t.accentSoft,
    "--lp-cream": t.cream,
    "--lp-cream-deep": t.creamDeep,
    "--lp-ink": t.ink,
    "--lp-ink-soft": t.inkSoft,
    "--color-lp-accent-ink": accentInk(t.accent),
  } as React.CSSProperties;
}

/** Monta um link wa.me a partir dos dígitos do WhatsApp. */
export function waLink(whatsapp: string, text?: string) {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}${
    text ? `?text=${encodeURIComponent(text)}` : ""
  }`;
}
