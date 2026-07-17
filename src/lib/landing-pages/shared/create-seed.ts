import type { LandingPageCreateFormValues } from "@/forms/LandingPageCreateForm/schema";
import type { FocoCopy } from "../focos";
import { matchFoco } from "../focos";
import { DEFAULT_HEADING_FONT_ID } from "../fonts";
import { imagemAleatoria } from "../image-bank";
import {
  DEFAULT_THEME,
  type Lawyer,
  type Layout,
  type Office,
  type Social,
  type Theme,
} from "../schema";
import type { SceneImages } from "../section-images";

/** Payload aceito por POST /api/gerar-lp (wizard → LP salva). */
export type GerarLpPayload = {
  name: string;
  tema: string;
  city: string;
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  address: string;
  mapsUrl: string;
  extraAddresses: Office["extraAddresses"];
  about: string;
  diferenciais: string[];
  videoId: string;
  logoSrc: string;
  logoBg: Office["logoBg"];
  theme: Theme;
  lawyers: Lawyer[];
  socials: Social[];
  copy: FocoCopy;
  images: SceneImages;
  layout: Layout;
};

/**
 * Converte os valores do wizard de criação no payload de POST /api/gerar-lp.
 * Centraliza o mapeamento create → persistência (antes inline no formulário).
 */
export function createGerarLpPayloadFromWizard(
  values: LandingPageCreateFormValues,
  extras: {
    name: string;
    copy: FocoCopy;
    images: GerarLpPayload["images"];
    layout: Layout;
    logoSrc: string;
  },
): GerarLpPayload {
  const {
    tema,
    about,
    diferenciais,
    whatsapp,
    whatsappDisplay,
    email,
    showAddress,
    addresses,
    showSocials,
    socials,
    videoId,
    logoBg,
    theme,
    lawyers,
  } = values;

  return {
    name: extras.name.trim(),
    tema: tema.trim(),
    city: showAddress
      ? [addresses[0]?.cidade, addresses[0]?.uf].filter(Boolean).join("/")
      : "",
    whatsapp,
    whatsappDisplay,
    email: email.trim(),
    address: showAddress ? (addresses[0]?.address.trim() ?? "") : "",
    mapsUrl: showAddress ? (addresses[0]?.mapsUrl.trim() ?? "") : "",
    extraAddresses: showAddress
      ? addresses
          .slice(1)
          .map((a) => ({
            address: a.address.trim(),
            city: [a.cidade, a.uf].filter(Boolean).join("/"),
            mapsUrl: a.mapsUrl.trim(),
          }))
          .filter((a) => a.address)
      : [],
    about: about.trim(),
    diferenciais: diferenciais.map((d) => d.val.trim()).filter(Boolean),
    videoId: videoId.trim(),
    logoSrc: extras.logoSrc,
    logoBg,
    theme,
    lawyers,
    socials: showSocials
      ? socials.map((s) => ({ ...s, url: s.url.trim() })).filter((s) => s.url)
      : [],
    copy: extras.copy,
    images: extras.images,
    layout: extras.layout,
  };
}

/**
 * Figura recortada do Topo. Com 2+ advogados a seção Equipe existe, e eleger um
 * rosto para o Topo seria favoritismo — então entra uma imagem genérica do tema,
 * distinta da cena de fundo. Com 0 ou 1 advogado o retrato dele segue valendo e
 * o slot fica vazio.
 */
function heroDestaqueFor(lawyers: Lawyer[], scenes: SceneImages): string {
  const withPhoto = lawyers.filter((l) => l.photo?.trim()).length;
  return withPhoto > 1 ? imagemAleatoria("hero", scenes.hero) : "";
}

/** Monta `Office` a partir do payload do wizard (usado em /api/gerar-lp). */
export function buildOfficeFromGerarLpPayload(
  p: GerarLpPayload,
  images: GerarLpPayload["images"],
): Office {
  const name = p.name.trim();
  const tema = p.tema.trim();
  const foco = matchFoco(tema);
  const theme: Theme = p.theme ?? DEFAULT_THEME;
  const lawyers = p.lawyers ?? [];

  return {
    name,
    fullName: name,
    product: foco?.product ?? tema,
    area: foco?.area ?? tema,
    city: p.city.trim(),
    whatsapp: p.whatsapp ?? "",
    whatsappDisplay: p.whatsappDisplay ?? "",
    email: p.email.trim(),
    address: p.address.trim(),
    mapsUrl: p.mapsUrl.trim(),
    extraAddresses: p.extraAddresses ?? [],
    about: p.about.trim(),
    diferenciais: p.diferenciais.map((d) => d.trim()).filter(Boolean),
    logoSrc: p.logoSrc ?? "",
    logoBg: p.logoBg ?? { type: "transparent", color: theme.brand },
    lawyers,
    socials: Array.isArray(p.socials)
      ? p.socials
          .map((s) => ({ ...s, url: (s.url ?? "").trim() }))
          .filter((s) => s.url)
      : [],
    sectionImages: {
      ...images,
      heroDestaque: heroDestaqueFor(lawyers, images),
    },
    metrics: [],
    // Botão flutuante de WhatsApp sempre presente (canto inferior direito).
    floatingButton: { enabled: true, action: "whatsapp" },
    // Tipografia padrão da LP gerada: Cormorant Garamond nos títulos (peso 600).
    // Corpo fica no padrão do site. Editável em Aparência → Tipografia.
    fonts: { heading: DEFAULT_HEADING_FONT_ID, body: "" },
  };
}
