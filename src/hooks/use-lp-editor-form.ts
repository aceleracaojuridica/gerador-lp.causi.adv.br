"use client";

import { useCallback, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  type LpEditorFormValues,
  lpEditorDefaultValues,
  validateLpEditorSave,
} from "@/forms/LpEditorForm/schema";
import {
  detectLogoBackground,
  extractPalette,
} from "@/lib/landing-pages/colors";
import {
  buildSchema,
  type FocoCopy,
  focoGenerico,
  matchFoco,
} from "@/lib/landing-pages/focos";
import {
  applyGlobalConfigToOffice,
  type GlobalConfig,
} from "@/lib/landing-pages/global-config";
import { maskPhone } from "@/lib/landing-pages/phone";
import type {
  CustomSection,
  Layout,
  LpSchema,
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
import { DEFAULT_THEME } from "@/lib/landing-pages/schema";
import type { LpTemplate } from "@/lib/landing-pages/templates";

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

const DEFAULT_BUTTONS = {
  radius: "square" as const,
  action: "popup" as const,
  link: "",
  popup: { questions: [] as PopupQuestion[] },
};

function seedToFormValues(seed?: LpSeed): LpEditorFormValues {
  if (!seed) return lpEditorDefaultValues();
  return lpEditorDefaultValues({
    office: seed.office,
    theme: seed.theme,
    layout: seed.layout,
    videoId: seed.videoId,
    tema: seed.tema,
    copy: seed.copy,
    customSections: seed.customSections,
    autoTheme: true,
  });
}

/**
 * Estado do estúdio com React Hook Form.
 * Validação Zod roda só no save/publicar (`validateSave`) — evita re-render
 * em centenas de campos com `mode: "onChange"`.
 */
export function useLpEditorForm(seed?: LpSeed) {
  const form = useForm<LpEditorFormValues>({
    defaultValues: seedToFormValues(seed),
    mode: "onSubmit",
  });

  const watched = useWatch({ control: form.control });
  const office = (watched.office ?? lpEditorDefaultValues().office) as Office;
  const theme = (watched.theme ?? DEFAULT_THEME) as Theme;
  const autoTheme = watched.autoTheme ?? false;
  const tema = watched.tema ?? "";
  const layout = (watched.layout ?? lpEditorDefaultValues().layout) as Layout;
  const videoId = watched.videoId ?? "";
  const copy = (watched.copy ?? focoGenerico()) as FocoCopy;
  const customSections = (watched.customSections ?? []) as CustomSection[];

  const set = useCallback(
    <K extends keyof LpEditorFormValues["office"]>(
      key: K,
      value: LpEditorFormValues["office"][K],
    ) => {
      // ponytail: Path<LpEditorFormValues> não infere `office.${K}` com K genérico
      form.setValue(`office.${key}` as const, value as never, {
        shouldDirty: true,
      });
    },
    [form],
  );

  function editCopy(fn: (c: FocoCopy) => void) {
    const base = structuredClone(form.getValues("copy"));
    fn(base);
    form.setValue("copy", base, { shouldDirty: true });
  }

  function setMetric(i: number, key: "icon" | "label", v: string) {
    const metrics = [...form.getValues("office.metrics")];
    metrics[i] = { ...metrics[i], [key]: v };
    form.setValue("office.metrics", metrics, { shouldDirty: true });
  }
  function addMetric() {
    const metrics = form.getValues("office.metrics");
    form.setValue(
      "office.metrics",
      [...metrics, { icon: "shield-check", label: "" }],
      { shouldDirty: true },
    );
  }
  function removeMetric(i: number) {
    form.setValue(
      "office.metrics",
      form.getValues("office.metrics").filter((_, idx) => idx !== i),
      { shouldDirty: true },
    );
  }

  function setHeroFeature(i: number, key: "icon" | "text", v: string) {
    const heroFeatures = [...(form.getValues("office.heroFeatures") ?? [])];
    heroFeatures[i] = { ...heroFeatures[i], [key]: v };
    form.setValue("office.heroFeatures", heroFeatures, { shouldDirty: true });
  }
  function addHeroFeature() {
    const heroFeatures = form.getValues("office.heroFeatures") ?? [];
    form.setValue(
      "office.heroFeatures",
      [...heroFeatures, { icon: "shield-check", text: "" }],
      { shouldDirty: true },
    );
  }
  function removeHeroFeature(i: number) {
    form.setValue(
      "office.heroFeatures",
      (form.getValues("office.heroFeatures") ?? []).filter(
        (_, idx) => idx !== i,
      ),
      { shouldDirty: true },
    );
  }

  function setDiferencial(i: number, v: string) {
    const diferenciais = [...form.getValues("office.diferenciais")];
    diferenciais[i] = v;
    form.setValue("office.diferenciais", diferenciais, { shouldDirty: true });
  }
  function addDiferencial() {
    form.setValue(
      "office.diferenciais",
      [...form.getValues("office.diferenciais"), ""],
      { shouldDirty: true },
    );
  }
  function removeDiferencial(i: number) {
    form.setValue(
      "office.diferenciais",
      form.getValues("office.diferenciais").filter((_, idx) => idx !== i),
      { shouldDirty: true },
    );
  }

  function onAddLawyerPhotos(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result);
        const lawyers = form.getValues("office.lawyers");
        form.setValue(
          "office.lawyers",
          [...lawyers, { photo: dataUrl, name: "", role: "" }],
          { shouldDirty: true },
        );
      };
      reader.readAsDataURL(file);
    });
  }
  function removeLawyerPhoto(i: number) {
    form.setValue(
      "office.lawyers",
      form.getValues("office.lawyers").filter((_, idx) => idx !== i),
      { shouldDirty: true },
    );
  }

  function setTone(key: keyof SectionTones, value: Tone) {
    const l = form.getValues("layout");
    form.setValue(
      "layout",
      { ...l, tones: { ...l.tones, [key]: value } },
      { shouldDirty: true },
    );
  }

  function setSectionHidden(key: ToggleableSection, hidden: boolean) {
    const l = form.getValues("layout");
    form.setValue(
      "layout",
      { ...l, hidden: { ...l.hidden, [key]: hidden } },
      { shouldDirty: true },
    );
  }

  function setSectionOrder(order: string[]) {
    const l = form.getValues("layout");
    form.setValue("layout", { ...l, order }, { shouldDirty: true });
  }

  function addSocial() {
    const socials = form.getValues("office.socials");
    form.setValue(
      "office.socials",
      [...socials, { network: "instagram", url: "" }],
      { shouldDirty: true },
    );
  }
  function setSocialField(i: number, key: "network" | "url", value: string) {
    form.setValue(
      "office.socials",
      form.getValues("office.socials").map((s, idx) =>
        idx === i
          ? {
              ...s,
              [key]: key === "network" ? (value as SocialNetwork) : value,
            }
          : s,
      ),
      { shouldDirty: true },
    );
  }
  function removeSocial(i: number) {
    form.setValue(
      "office.socials",
      form.getValues("office.socials").filter((_, idx) => idx !== i),
      { shouldDirty: true },
    );
  }

  function addAddress() {
    const extra = form.getValues("office.extraAddresses") ?? [];
    form.setValue(
      "office.extraAddresses",
      [...extra, { address: "", city: "", mapsUrl: "" }],
      { shouldDirty: true },
    );
  }
  function setAddressField(
    i: number,
    key: "address" | "city" | "mapsUrl",
    v: string,
  ) {
    form.setValue(
      "office.extraAddresses",
      (form.getValues("office.extraAddresses") ?? []).map((a, idx) =>
        idx === i ? { ...a, [key]: v } : a,
      ),
      { shouldDirty: true },
    );
  }
  function removeAddress(i: number) {
    form.setValue(
      "office.extraAddresses",
      (form.getValues("office.extraAddresses") ?? []).filter(
        (_, idx) => idx !== i,
      ),
      { shouldDirty: true },
    );
  }

  function addContact() {
    const extra = form.getValues("office.extraContacts") ?? [];
    form.setValue(
      "office.extraContacts",
      [...extra, { whatsapp: "", whatsappDisplay: "", email: "" }],
      { shouldDirty: true },
    );
  }
  function setContactPhone(i: number, v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    form.setValue(
      "office.extraContacts",
      (form.getValues("office.extraContacts") ?? []).map((c, idx) =>
        idx === i
          ? {
              ...c,
              whatsapp: digits ? `55${digits}` : "",
              whatsappDisplay: maskPhone(digits),
            }
          : c,
      ),
      { shouldDirty: true },
    );
  }
  function setContactEmail(i: number, v: string) {
    form.setValue(
      "office.extraContacts",
      (form.getValues("office.extraContacts") ?? []).map((c, idx) =>
        idx === i ? { ...c, email: v } : c,
      ),
      { shouldDirty: true },
    );
  }
  function removeContact(i: number) {
    form.setValue(
      "office.extraContacts",
      (form.getValues("office.extraContacts") ?? []).filter(
        (_, idx) => idx !== i,
      ),
      { shouldDirty: true },
    );
  }

  function setButtonField(key: "radius" | "action" | "link", value: string) {
    const buttons = form.getValues("office.buttons") ?? DEFAULT_BUTTONS;
    form.setValue(
      "office.buttons",
      { ...DEFAULT_BUTTONS, ...buttons, [key]: value } as Office["buttons"],
      { shouldDirty: true },
    );
  }
  function setPopupQuestions(questions: PopupQuestion[]) {
    const buttons = form.getValues("office.buttons") ?? DEFAULT_BUTTONS;
    const prevPopup = buttons?.popup;
    form.setValue(
      "office.buttons",
      {
        ...DEFAULT_BUTTONS,
        ...buttons,
        popup: {
          questions,
          email:
            prevPopup && "email" in prevPopup ? prevPopup.email : undefined,
        },
      },
      { shouldDirty: true },
    );
  }
  function setPopupEmail(
    email: { enabled: boolean; required: boolean } | undefined,
  ) {
    const buttons = form.getValues("office.buttons") ?? DEFAULT_BUTTONS;
    form.setValue(
      "office.buttons",
      {
        ...DEFAULT_BUTTONS,
        ...buttons,
        popup: { questions: buttons?.popup?.questions ?? [], email },
      },
      { shouldDirty: true },
    );
  }

  function setSeoField<K extends keyof SeoMeta>(key: K, value: SeoMeta[K]) {
    editCopy((c) => {
      c.seo = { ...(c.seo ?? {}), [key]: value } as SeoMeta;
    });
  }

  function setFont(part: "heading" | "body", id: string) {
    const fonts = form.getValues("office.fonts") ?? { heading: "", body: "" };
    form.setValue(
      "office.fonts",
      { ...fonts, [part]: id },
      { shouldDirty: true },
    );
  }

  function setTag(part: "head" | "body" | "footer", v: string) {
    const tags = form.getValues("office.tags") ?? {
      head: "",
      body: "",
      footer: "",
    };
    form.setValue("office.tags", { ...tags, [part]: v }, { shouldDirty: true });
  }

  function setTrackingField(
    key:
      | "ga4MeasurementId"
      | "gtmContainerId"
      | "metaPixelId"
      | "googleAdsId"
      | "googleAdsLabel",
    value: string,
  ) {
    const tracking = form.getValues("office.tracking") ?? {
      ga4MeasurementId: "",
      gtmContainerId: "",
      metaPixelId: "",
      googleAdsId: "",
      googleAdsLabel: "",
    };
    form.setValue(
      "office.tracking",
      { ...tracking, [key]: value },
      { shouldDirty: true },
    );
  }

  function setCaptchaField(
    key: "provider" | "siteKey" | "widgetTheme",
    value: string,
  ) {
    const captcha = form.getValues("office.captcha") ?? {
      provider: "none" as const,
      siteKey: "",
      widgetTheme: "auto" as const,
    };
    form.setValue(
      "office.captcha",
      { ...captcha, [key]: value },
      { shouldDirty: true },
    );
  }

  const applyAccountDefaults = useCallback(
    (config: GlobalConfig, overwrite = false) => {
      const values = form.getValues();
      form.reset(
        {
          ...values,
          office: applyGlobalConfigToOffice(values.office, config, {
            overwrite,
          }),
        },
        { keepDirty: false, keepTouched: true, keepErrors: true },
      );
    },
    [form],
  );

  function addCustomSection(kind: CustomSection["kind"]) {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `cs-${Math.random().toString(36).slice(2)}`;
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
    form.setValue(
      "customSections",
      [...form.getValues("customSections"), base],
      { shouldDirty: true },
    );
  }
  function setCustomField(
    id: string,
    key: "eyebrow" | "title" | "text",
    v: string,
  ) {
    form.setValue(
      "customSections",
      form
        .getValues("customSections")
        .map((s) => (s.id === id ? { ...s, [key]: v } : s)),
      { shouldDirty: true },
    );
  }
  function setCustomTone(id: string, tone: Tone) {
    form.setValue(
      "customSections",
      form
        .getValues("customSections")
        .map((s) => (s.id === id ? { ...s, tone } : s)),
      { shouldDirty: true },
    );
  }
  function removeCustomSection(id: string) {
    form.setValue(
      "customSections",
      form.getValues("customSections").filter((s) => s.id !== id),
      { shouldDirty: true },
    );
  }
  function addCustomCard(id: string) {
    form.setValue(
      "customSections",
      form
        .getValues("customSections")
        .map((s) =>
          s.id === id
            ? { ...s, cards: [...s.cards, { title: "", text: "" }] }
            : s,
        ),
      { shouldDirty: true },
    );
  }
  function setCustomCardField(
    id: string,
    idx: number,
    key: "title" | "text",
    v: string,
  ) {
    form.setValue(
      "customSections",
      form.getValues("customSections").map((s) =>
        s.id === id
          ? {
              ...s,
              cards: s.cards.map((c, i) =>
                i === idx ? { ...c, [key]: v } : c,
              ),
            }
          : s,
      ),
      { shouldDirty: true },
    );
  }
  function removeCustomCard(id: string, idx: number) {
    form.setValue(
      "customSections",
      form
        .getValues("customSections")
        .map((s) =>
          s.id === id
            ? { ...s, cards: s.cards.filter((_, i) => i !== idx) }
            : s,
        ),
      { shouldDirty: true },
    );
  }

  function setLawyerField(i: number, key: "name" | "role", v: string) {
    form.setValue(
      "office.lawyers",
      form
        .getValues("office.lawyers")
        .map((l, idx) => (idx === i ? { ...l, [key]: v } : l)),
      { shouldDirty: true },
    );
  }
  function setLawyerPhoto(i: number, photo: string) {
    form.setValue(
      "office.lawyers",
      form
        .getValues("office.lawyers")
        .map((l, idx) => (idx === i ? { ...l, photo } : l)),
      { shouldDirty: true },
    );
  }
  function setLawyerFocal(i: number, focal: { x: number; y: number }) {
    form.setValue(
      "office.lawyers",
      form
        .getValues("office.lawyers")
        .map((l, idx) => (idx === i ? { ...l, focal } : l)),
      { shouldDirty: true },
    );
  }

  function onSectionImage(key: SectionImageKey, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const sectionImages = form.getValues("office.sectionImages");
      form.setValue(
        "office.sectionImages",
        { ...sectionImages, [key]: dataUrl },
        { shouldDirty: true },
      );
    };
    reader.readAsDataURL(file);
  }
  function clearSectionImage(key: SectionImageKey) {
    const sectionImages = form.getValues("office.sectionImages");
    form.setValue(
      "office.sectionImages",
      { ...sectionImages, [key]: "" },
      { shouldDirty: true },
    );
  }
  function setSectionImageUrl(key: SectionImageKey, url: string) {
    const sectionImages = form.getValues("office.sectionImages");
    form.setValue(
      "office.sectionImages",
      { ...sectionImages, [key]: url },
      { shouldDirty: true },
    );
  }

  function onPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    form.setValue("office.whatsapp", digits ? `55${digits}` : "", {
      shouldDirty: true,
    });
    form.setValue("office.whatsappDisplay", maskPhone(digits), {
      shouldDirty: true,
    });
  }

  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      set("logoSrc", dataUrl);
      const img = new Image();
      img.onload = () => {
        const pal = extractPalette(img);
        form.setValue("theme", pal, { shouldDirty: true });
        const o = form.getValues("office");
        form.setValue(
          "office",
          { ...o, logoBg: detectLogoBackground(img) },
          { shouldDirty: true },
        );
        form.setValue(
          "autoTheme",
          pal.brand !== DEFAULT_THEME.brand ||
            pal.accent !== DEFAULT_THEME.accent,
          { shouldDirty: true },
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
      form.setValue("theme", pal, { shouldDirty: true });
      const o = form.getValues("office");
      form.setValue(
        "office",
        { ...o, logoBg: detectLogoBackground(img) },
        { shouldDirty: true },
      );
      form.setValue("autoTheme", true, { shouldDirty: true });
    };
    img.src = url;
  }

  function resetTheme() {
    form.setValue("theme", DEFAULT_THEME, { shouldDirty: true });
    form.setValue("autoTheme", false, { shouldDirty: true });
  }

  function applyPalette(t: Theme) {
    form.setValue("theme", t, { shouldDirty: true });
    form.setValue("autoTheme", true, { shouldDirty: true });
  }

  function applyTemplate(template: LpTemplate) {
    const l = form.getValues("layout");
    form.setValue(
      "layout",
      {
        ...template.layout,
        order: l.order,
        hidden: { ...template.layout.hidden, ...l.hidden },
      },
      { shouldDirty: true },
    );
  }

  function setTema(value: string) {
    form.setValue("tema", value, { shouldDirty: true });
  }

  function setLayout(updater: Layout | ((l: Layout) => Layout)) {
    const current = form.getValues("layout");
    const next = typeof updater === "function" ? updater(current) : updater;
    form.setValue("layout", next, { shouldDirty: true });
  }

  function setVideoId(value: string) {
    form.setValue("videoId", value, { shouldDirty: true });
  }

  const focoMeta = matchFoco(tema);

  const officeForSchema = useMemo((): Office => {
    return {
      ...office,
      fullName: office.fullName || office.name,
      product: office.product || focoMeta?.product || tema,
      area: office.area || focoMeta?.area || tema,
      diferenciais: office.diferenciais.map((d) => d.trim()).filter(Boolean),
      heroFeatures: (office.heroFeatures ?? [])
        .map((f) => ({ ...f, text: f.text.trim() }))
        .filter((f) => f.text),
      metrics: office.metrics
        .map((m) => ({ ...m, label: m.label.trim() }))
        .filter((m) => m.label),
      socials: office.socials
        .map((s) => ({ ...s, url: s.url.trim() }))
        .filter((s) => s.url),
      extraAddresses: (office.extraAddresses ?? []).filter(
        (a) => a.address.trim() || a.city.trim(),
      ),
      extraContacts: (office.extraContacts ?? []).filter(
        (c) => c.whatsappDisplay.trim() || c.email.trim(),
      ),
    };
  }, [office, focoMeta, tema]);

  const schema = useMemo(
    (): LpSchema => ({
      ...buildSchema(
        officeForSchema,
        theme,
        tema,
        layout,
        videoId || undefined,
        copy,
      ),
      customSections,
    }),
    [theme, tema, layout, videoId, copy, customSections, officeForSchema],
  );

  function markSaved() {
    form.reset(form.getValues(), { keepValues: true });
  }

  function validateSave() {
    return validateLpEditorSave(form.getValues());
  }

  return {
    form,
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
    setTrackingField,
    setCaptchaField,
    setFont,
    setButtonField,
    setPopupQuestions,
    setPopupEmail,
    applyAccountDefaults,
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
    copy,
    editCopy,
    schema,
    markSaved,
    validateSave,
    isDirty: form.formState.isDirty,
  };
}

export type LpEditorForm = ReturnType<typeof useLpEditorForm>;

export { EMPTY_OFFICE } from "@/forms/LpEditorForm/schema";
