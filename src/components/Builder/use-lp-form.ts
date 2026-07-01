"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DEFAULT_LOGO_BG,
  detectLogoBackground,
  extractPalette,
} from "@/lib/landing-pages/colors";
import {
  buildSchema,
  type FocoCopy,
  focoGenerico,
  matchFoco,
} from "@/lib/landing-pages/focos";
import type {
  CustomSection,
  Layout,
  Office,
  PopupQuestion,
  SectionImageKey,
  SectionTones,
  SeoMeta,
  SocialNetwork,
  Theme,
  ToggleableSection,
  Tone,
} from "@/lib/landing-pages/schema";
import { DEFAULT_LAYOUT, DEFAULT_THEME } from "@/lib/landing-pages/schema";
import type { LpTemplate } from "@/lib/landing-pages/templates";
import { maskPhone } from "./fields";

/** Estado inicial para abrir uma LP já gerada (vinda de lps/<slug>.json). */
export type LpSeed = {
  office: Office;
  theme: Theme;
  layout: Layout;
  videoId: string;
  tema: string;
  copy: FocoCopy;
  customSections: CustomSection[];
};

export const EMPTY_OFFICE: Office = {
  name: "",
  fullName: "",
  product: "",
  area: "",
  city: "",
  whatsapp: "",
  whatsappDisplay: "",
  email: "",
  address: "",
  mapsUrl: "",
  extraAddresses: [],
  extraContacts: [],
  tags: { head: "", body: "", footer: "" },
  domain: "",
  fonts: { heading: "", body: "" },
  cardRadius: "square",
  buttons: {
    radius: "square",
    action: "popup",
    link: "",
    popup: { questions: [] },
  },
  about: "",
  diferenciais: [""],
  logoSrc: "",
  logoBg: DEFAULT_LOGO_BG,
  lawyers: [],
  socials: [{ network: "instagram", url: "" }], // começa com 1 linha (o "+" adiciona)
  sectionImages: { hero: "", dor: "", sobre: "", solucao: "" },
  metrics: [],
  heroFeatures: [],
};

/**
 * Estado único do estúdio. Recebe `seed` (a LP já gerada pelo Claude) e deixa
 * o usuário ajustar/aprovar no editor. O frontend não gera copy.
 */
function newLawyerId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `lawyer-${Math.random().toString(36).slice(2, 10)}`;
}

export function useLpForm(seed?: LpSeed, slug?: string) {
  // Ao abrir uma LP existente sem redes, garante 1 linha vazia para edição.
  const seededOffice = seed?.office
    ? {
        ...seed.office,
        socials: seed.office.socials.length
          ? seed.office.socials
          : [{ network: "instagram" as const, url: "" }],
        // LPs salvas antes desses campos não os têm — garante valor.
        extraAddresses: seed.office.extraAddresses ?? [],
        extraContacts: seed.office.extraContacts ?? [],
        tags: seed.office.tags ?? { head: "", body: "", footer: "" },
        domain: seed.office.domain ?? "",
        fonts: seed.office.fonts ?? { heading: "", body: "" },
        cardRadius: seed.office.cardRadius ?? "square",
        buttons: seed.office.buttons ?? {
          radius: "square",
          action: "popup",
          link: "",
          popup: { questions: [] },
        },
        // LPs sem heroFeatures salvos herdam os destaques da copy gerada (ícone +
        // título curto), já editáveis no editor.
        heroFeatures:
          seed.office.heroFeatures ??
          (seed.copy.hero.features ?? []).map((f) => ({
            icon: f.icon,
            text: f.title,
          })),
      }
    : EMPTY_OFFICE;
  const [office, setOffice] = useState<Office>(seededOffice);
  const [theme, setTheme] = useState<Theme>(seed?.theme ?? DEFAULT_THEME);
  const [autoTheme, setAutoTheme] = useState(!!seed); // LP gerada já vem tematizada
  const [tema, setTema] = useState<string>(seed?.tema ?? ""); // tema da LP (referência)
  const [layout, setLayout] = useState<Layout>(seed?.layout ?? DEFAULT_LAYOUT);
  const [videoId, setVideoId] = useState(seed?.videoId ?? "");
  const [aiCopy, setAiCopy] = useState<FocoCopy | null>(seed?.copy ?? null); // copy gerada pelo Claude (editável)

  // Copy textual EFETIVA (para exibir/editar): usa a da IA; se ainda não houver,
  // deriva do foco casado por palavra-chave ou da base genérica — o mesmo que o
  // preview renderiza, para os campos baterem com a página.
  const copy: FocoCopy = aiCopy ?? matchFoco(tema)?.copy ?? focoGenerico();

  // Edita os TEXTOS das seções (manchetes, subtítulos, cards, FAQ, etapas...).
  // Recebe um "produtor" que muta um clone da copy atual.
  function editCopy(fn: (c: FocoCopy) => void) {
    setAiCopy((prev) => {
      const base = structuredClone(
        prev ?? matchFoco(tema)?.copy ?? focoGenerico(),
      );
      fn(base);
      return base;
    });
  }

  // Seções extras criadas pelo usuário (cards ou texto).
  const [customSections, setCustomSections] = useState<CustomSection[]>(
    seed?.customSections ?? [],
  );

  const set = useCallback(
    <K extends keyof Office>(key: K, value: Office[K]) => {
      setOffice((o) => ({ ...o, [key]: value }));
    },
    [],
  );

  function setMetric(i: number, key: "icon" | "label", v: string) {
    setOffice((o) => {
      const metrics = [...o.metrics];
      metrics[i] = { ...metrics[i], [key]: v };
      return { ...o, metrics };
    });
  }
  function addMetric() {
    setOffice((o) => ({
      ...o,
      metrics: [...o.metrics, { icon: "shield-check", label: "" }],
    }));
  }
  function removeMetric(i: number) {
    setOffice((o) => ({
      ...o,
      metrics: o.metrics.filter((_, idx) => idx !== i),
    }));
  }

  /* ----- mini-cards do Hero centralizado (ícone + texto) ----- */
  function setHeroFeature(i: number, key: "icon" | "text", v: string) {
    setOffice((o) => {
      const heroFeatures = [...(o.heroFeatures ?? [])];
      heroFeatures[i] = { ...heroFeatures[i], [key]: v };
      return { ...o, heroFeatures };
    });
  }
  function addHeroFeature() {
    setOffice((o) => ({
      ...o,
      heroFeatures: [
        ...(o.heroFeatures ?? []),
        { icon: "shield-check", text: "" },
      ],
    }));
  }
  function removeHeroFeature(i: number) {
    setOffice((o) => ({
      ...o,
      heroFeatures: (o.heroFeatures ?? []).filter((_, idx) => idx !== i),
    }));
  }

  /* ----- diferenciais (lista dinâmica) ----- */
  function setDiferencial(i: number, v: string) {
    setOffice((o) => {
      const diferenciais = [...o.diferenciais];
      diferenciais[i] = v;
      return { ...o, diferenciais };
    });
  }
  function addDiferencial() {
    setOffice((o) => ({ ...o, diferenciais: [...o.diferenciais, ""] }));
  }
  function removeDiferencial(i: number) {
    setOffice((o) => ({
      ...o,
      diferenciais: o.diferenciais.filter((_, idx) => idx !== i),
    }));
  }

  function onAddLawyerPhotos(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        setOffice((o) => ({
          ...o,
          lawyers: [...o.lawyers, { photo: dataUrl, name: "", role: "" }],
        }));
      };
      reader.readAsDataURL(file);
    });
  }
  function removeLawyerPhoto(i: number) {
    setOffice((o) => ({
      ...o,
      lawyers: o.lawyers.filter((_, idx) => idx !== i),
    }));
  }
  // Alterna o tom (claro/escuro) de uma seção.
  function setTone(key: keyof SectionTones, value: Tone) {
    setLayout((l) => ({ ...l, tones: { ...l.tones, [key]: value } }));
  }

  // Liga/desliga uma seção não obrigatória (a chave do cabeçalho).
  function setSectionHidden(key: ToggleableSection, hidden: boolean) {
    setLayout((l) => ({ ...l, hidden: { ...l.hidden, [key]: hidden } }));
  }

  // Nova ordem das seções do meio (drag-drop).
  function setSectionOrder(order: string[]) {
    setLayout((l) => ({ ...l, order }));
  }

  // Redes sociais: lista com seletor de rede (permite repetir). O "+" adiciona;
  // vazias são removidas ao gerar/salvar (officeForSchema).
  function addSocial() {
    setOffice((o) => ({
      ...o,
      socials: [...o.socials, { network: "instagram", url: "" }],
    }));
  }
  function setSocialField(i: number, key: "network" | "url", value: string) {
    setOffice((o) => ({
      ...o,
      socials: o.socials.map((s, idx) =>
        idx === i
          ? {
              ...s,
              [key]: key === "network" ? (value as SocialNetwork) : value,
            }
          : s,
      ),
    }));
  }
  function removeSocial(i: number) {
    setOffice((o) => ({
      ...o,
      socials: o.socials.filter((_, idx) => idx !== i),
    }));
  }

  /* ----- endereços adicionais (rodapé) ----- */
  function addAddress() {
    setOffice((o) => ({
      ...o,
      extraAddresses: [
        ...(o.extraAddresses ?? []),
        { address: "", city: "", mapsUrl: "" },
      ],
    }));
  }
  function setAddressField(
    i: number,
    key: "address" | "city" | "mapsUrl",
    v: string,
  ) {
    setOffice((o) => ({
      ...o,
      extraAddresses: (o.extraAddresses ?? []).map((a, idx) =>
        idx === i ? { ...a, [key]: v } : a,
      ),
    }));
  }
  function removeAddress(i: number) {
    setOffice((o) => ({
      ...o,
      extraAddresses: (o.extraAddresses ?? []).filter((_, idx) => idx !== i),
    }));
  }

  /* ----- contatos adicionais (rodapé) ----- */
  function addContact() {
    setOffice((o) => ({
      ...o,
      extraContacts: [
        ...(o.extraContacts ?? []),
        { whatsapp: "", whatsappDisplay: "", email: "" },
      ],
    }));
  }
  function setContactPhone(i: number, v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    setOffice((o) => ({
      ...o,
      extraContacts: (o.extraContacts ?? []).map((c, idx) =>
        idx === i
          ? {
              ...c,
              whatsapp: digits ? `55${digits}` : "",
              whatsappDisplay: maskPhone(digits),
            }
          : c,
      ),
    }));
  }
  function setContactEmail(i: number, v: string) {
    setOffice((o) => ({
      ...o,
      extraContacts: (o.extraContacts ?? []).map((c, idx) =>
        idx === i ? { ...c, email: v } : c,
      ),
    }));
  }
  function removeContact(i: number) {
    setOffice((o) => ({
      ...o,
      extraContacts: (o.extraContacts ?? []).filter((_, idx) => idx !== i),
    }));
  }

  /* ----- botões de CTA ----- */
  const DEFAULT_BUTTONS = {
    radius: "square" as const,
    action: "popup" as const,
    link: "",
    popup: { questions: [] },
  };
  function setButtonField(key: "radius" | "action" | "link", value: string) {
    setOffice((o) => ({
      ...o,
      buttons: {
        ...DEFAULT_BUTTONS,
        ...o.buttons,
        [key]: value,
      } as Office["buttons"],
    }));
  }
  // Substitui a lista de perguntas do popup (a UI calcula o novo array).
  function setPopupQuestions(questions: PopupQuestion[]) {
    setOffice((o) => ({
      ...o,
      buttons: {
        ...DEFAULT_BUTTONS,
        ...o.buttons,
        popup: { email: o.buttons?.popup?.email, questions },
      },
    }));
  }
  function setPopupEmail(
    email: { enabled: boolean; required: boolean } | undefined,
  ) {
    setOffice((o) => ({
      ...o,
      buttons: {
        ...DEFAULT_BUTTONS,
        ...o.buttons,
        popup: { questions: o.buttons?.popup?.questions ?? [], email },
      },
    }));
  }

  /* ----- SEO ----- */
  function setSeoField<K extends keyof SeoMeta>(key: K, value: SeoMeta[K]) {
    editCopy((c) => {
      c.seo = { ...(c.seo ?? {}), [key]: value } as SeoMeta;
    });
  }

  /* ----- tipografia ----- */
  function setFont(part: "heading" | "body", id: string) {
    setOffice((o) => ({
      ...o,
      fonts: { heading: "", body: "", ...o.fonts, [part]: id },
    }));
  }

  /* ----- configurações técnicas (tags de conversão) ----- */
  function setTag(part: "head" | "body" | "footer", v: string) {
    setOffice((o) => ({
      ...o,
      tags: { head: "", body: "", footer: "", ...o.tags, [part]: v },
    }));
  }

  /* ----- seções personalizadas (cards ou texto) ----- */
  function addCustomSection(kind: CustomSection["kind"]) {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cs-${Math.random().toString(36).slice(2)}`;
    // Já nasce com conteúdo de exemplo para aparecer no preview na hora.
    const base: CustomSection =
      kind === "texto"
        ? {
            id,
            kind,
            tone: "light",
            eyebrow: "",
            title: "Nova seção",
            text: "Escreva aqui o conteúdo desta seção.",
            cards: [],
          }
        : {
            id,
            kind,
            tone: "light",
            eyebrow: "",
            title: "Nova seção",
            text: "",
            cards: [
              { title: "Item 1", text: "Descrição do primeiro item." },
              { title: "Item 2", text: "Descrição do segundo item." },
              { title: "Item 3", text: "Descrição do terceiro item." },
            ],
          };
    setCustomSections((arr) => [...arr, base]);
  }
  function setCustomField(
    id: string,
    key: "eyebrow" | "title" | "text",
    v: string,
  ) {
    setCustomSections((arr) =>
      arr.map((s) => (s.id === id ? { ...s, [key]: v } : s)),
    );
  }
  function setCustomTone(id: string, tone: Tone) {
    setCustomSections((arr) =>
      arr.map((s) => (s.id === id ? { ...s, tone } : s)),
    );
  }
  function removeCustomSection(id: string) {
    setCustomSections((arr) => arr.filter((s) => s.id !== id));
  }
  function addCustomCard(id: string) {
    setCustomSections((arr) =>
      arr.map((s) =>
        s.id === id
          ? { ...s, cards: [...s.cards, { title: "", text: "" }] }
          : s,
      ),
    );
  }
  function setCustomCardField(
    id: string,
    idx: number,
    key: "title" | "text",
    v: string,
  ) {
    setCustomSections((arr) =>
      arr.map((s) =>
        s.id === id
          ? {
              ...s,
              cards: s.cards.map((c, i) =>
                i === idx ? { ...c, [key]: v } : c,
              ),
            }
          : s,
      ),
    );
  }
  function removeCustomCard(id: string, idx: number) {
    setCustomSections((arr) =>
      arr.map((s) =>
        s.id === id ? { ...s, cards: s.cards.filter((_, i) => i !== idx) } : s,
      ),
    );
  }

  // Edita nome/função de um advogado já enviado.
  function setLawyerField(i: number, key: "name" | "role", v: string) {
    setOffice((o) => ({
      ...o,
      lawyers: o.lawyers.map((l, idx) => (idx === i ? { ...l, [key]: v } : l)),
    }));
  }
  // Substitui a foto de um advogado (ex.: versão melhorada pela IA).
  function setLawyerPhoto(i: number, photo: string) {
    setOffice((o) => ({
      ...o,
      lawyers: o.lawyers.map((l, idx) => (idx === i ? { ...l, photo } : l)),
    }));
  }
  // Define o enquadramento (ponto focal % x/y) da foto de um advogado.
  function setLawyerFocal(i: number, focal: { x: number; y: number }) {
    setOffice((o) => ({
      ...o,
      lawyers: o.lawyers.map((l, idx) => (idx === i ? { ...l, focal } : l)),
    }));
  }

  // Imagem por seção (Hero/Dor/Sobre): o usuário sobe no editor e escolhe onde.
  function onSectionImage(key: SectionImageKey, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      setOffice((o) => ({
        ...o,
        sectionImages: { ...o.sectionImages, [key]: dataUrl },
      }));
    };
    reader.readAsDataURL(file);
  }
  function clearSectionImage(key: SectionImageKey) {
    setOffice((o) => ({
      ...o,
      sectionImages: { ...o.sectionImages, [key]: "" },
    }));
  }
  // Define a imagem de uma seção por URL (ex.: imagem escolhida pela IA).
  function setSectionImageUrl(key: SectionImageKey, url: string) {
    setOffice((o) => ({
      ...o,
      sectionImages: { ...o.sectionImages, [key]: url },
    }));
  }

  function onPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    setOffice((o) => ({
      ...o,
      whatsapp: digits ? `55${digits}` : "",
      whatsappDisplay: maskPhone(digits),
    }));
  }

  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      set("logoSrc", dataUrl);
      const img = new Image();
      img.onload = () => {
        const pal = extractPalette(img);
        setTheme(pal);
        setOffice((o) => ({ ...o, logoBg: detectLogoBackground(img) }));
        setAutoTheme(
          pal.brand !== DEFAULT_THEME.brand ||
            pal.accent !== DEFAULT_THEME.accent,
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function setLogoUrl(url: string) {
    set("logoSrc", url);
    if (!url) return;
    const img = new Image();
    img.onload = () => {
      const pal = extractPalette(img);
      setTheme(pal);
      setOffice((o) => ({ ...o, logoBg: detectLogoBackground(img) }));
      setAutoTheme(true);
    };
    img.src = url;
  }

  function resetTheme() {
    setTheme(DEFAULT_THEME);
    setAutoTheme(false);
  }

  // Aplica uma paleta pré-pronta (sobrescreve a extração da logo).
  function applyPalette(t: Theme) {
    setTheme(t);
    setAutoTheme(true);
  }

  /** Aplica layout de um preset; preserva ordem, seções ocultas e cores da logo. */
  function applyTemplate(template: LpTemplate) {
    setLayout((l) => ({
      ...template.layout,
      order: l.order,
      hidden: { ...template.layout.hidden, ...l.hidden },
    }));
  }

  // product/area: usa o que veio na LP gerada; se vazio, deriva do tema (foco
  // conhecido por palavra-chave, ou o próprio texto do tema).
  const focoMeta = matchFoco(tema);
  const officeForSchema = useMemo((): Office => {
    return {
      ...office,
      fullName: office.fullName || office.name,
      product: office.product || focoMeta?.product || tema,
      area: office.area || focoMeta?.area || tema,
      // remove diferenciais vazios antes de renderizar
      diferenciais: office.diferenciais.map((d) => d.trim()).filter(Boolean),
      // remove mini-cards do Hero sem texto antes de renderizar
      heroFeatures: (office.heroFeatures ?? [])
        .map((f) => ({ ...f, text: f.text.trim() }))
        .filter((f) => f.text),
      // remove destaques (métricas) sem texto antes de renderizar
      metrics: office.metrics
        .map((m) => ({ ...m, label: m.label.trim() }))
        .filter((m) => m.label),
      // remove redes sem link
      socials: office.socials
        .map((s) => ({ ...s, url: s.url.trim() }))
        .filter((s) => s.url),
      // remove endereços/contatos adicionais sem conteúdo antes de renderizar
      extraAddresses: (office.extraAddresses ?? []).filter(
        (a) => a.address.trim() || a.city.trim(),
      ),
      extraContacts: (office.extraContacts ?? []).filter(
        (c) => c.whatsappDisplay.trim() || c.email.trim(),
      ),
    };
  }, [office, focoMeta, tema]);

  const schema = useMemo(
    () => ({
      ...buildSchema(
        officeForSchema,
        theme,
        tema,
        layout,
        videoId || undefined,
        aiCopy,
      ),
      customSections,
    }),
    [theme, tema, layout, videoId, aiCopy, customSections, officeForSchema],
  );

  return {
    office,
    set,
    setMetric,
    addMetric,
    removeMetric,
    setHeroFeature,
    addHeroFeature,
    removeHeroFeature,
    setDiferencial,
    addDiferencial,
    removeDiferencial,
    onAddLawyerPhotos,
    removeLawyerPhoto,
    setLawyerField,
    setLawyerPhoto,
    setLawyerFocal,
    setTone,
    setSectionHidden,
    setSectionOrder,
    addSocial,
    setSocialField,
    removeSocial,
    addAddress,
    setAddressField,
    removeAddress,
    addContact,
    setContactPhone,
    setContactEmail,
    removeContact,
    setSeoField,
    setTag,
    setFont,
    setButtonField,
    setPopupQuestions,
    setPopupEmail,
    customSections,
    addCustomSection,
    setCustomField,
    setCustomTone,
    removeCustomSection,
    addCustomCard,
    setCustomCardField,
    removeCustomCard,
    onSectionImage,
    clearSectionImage,
    setSectionImageUrl,
    onPhone,
    onLogo,
    setLogoUrl,
    theme,
    autoTheme,
    resetTheme,
    applyPalette,
    applyTemplate,
    tema,
    setTema,
    layout,
    setLayout,
    videoId,
    setVideoId,
    aiCopy,
    copy,
    editCopy,
    schema,
  };
}

export type LpForm = ReturnType<typeof useLpForm>;
