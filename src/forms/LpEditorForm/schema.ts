import type { FieldPath, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { DEFAULT_LOGO_BG } from "@/lib/landing-pages/colors";
import { type FocoCopy, focoGenerico } from "@/lib/landing-pages/focos";
import { DEFAULT_TRACKING } from "@/lib/landing-pages/global-config";
import { normalizeOfficeButtons } from "@/lib/landing-pages/popup/normalize";
import type {
  CustomSection,
  Layout,
  Office,
  Theme,
} from "@/lib/landing-pages/schema";
import { DEFAULT_LAYOUT, DEFAULT_THEME } from "@/lib/landing-pages/schema";
import { EMPTY_SECTION_IMAGES } from "@/lib/landing-pages/section-images";
import { normalizeTracking } from "@/lib/landing-pages/tracking";
import {
  refineRequiredEmail,
  refineRequiredWhatsapp,
} from "@/lib/landing-pages/validation/contact";
import { trackingProviderConfigSchema } from "@/lib/landing-pages/validation/tracking-schema";
import {
  AREAS_VARIANTS,
  DOR_VARIANTS,
  EQUIPE_VARIANTS,
  ETAPAS_VARIANTS,
  HERO_VARIANTS,
  SOBRE_VARIANTS,
  SOLUCAO_VARIANTS,
} from "@/lib/landing-pages/variants";
import {
  customScriptTagSchema,
  extraAddressSchema,
  extraContactSchema,
  focalSchema,
  heroFeatureSchema,
  lawyerSchema,
  logoBgSchema,
  metricSchema,
  popupQuestionSchema,
  socialSchema,
  themeSchema,
} from "@/lib/landing-pages/zod-shared";

const headlineSchema = z.object({
  pre: z.string(),
  em: z.string(),
  post: z.string(),
});

const iconCardSchema = z.object({
  icon: z.string(),
  title: z.string(),
  text: z.string(),
});

/** Área: card com ícone/título/texto + sub-itens em bullets. */
const areaCardSchema = iconCardSchema.extend({
  items: z.array(z.string()).optional(),
});

const faqItemSchema = z.object({
  q: z.string(),
  a: z.string(),
});

const etapaItemSchema = z.object({
  title: z.string(),
  text: z.string(),
});

const seoMetaSchema = z.object({
  title: z.string(),
  description: z.string(),
  ogImage: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  favicon: z.string().optional(),
  keywords: z.string().optional(),
  siteName: z.string().optional(),
  canonicalUrl: z.string().optional(),
  indexable: z.boolean().optional(),
});

const focoCopySchema = z.object({
  hero: z.object({
    eyebrow: z.string(),
    headline: headlineSchema,
    sub: z.string(),
    ctaPrimary: z.string().optional(),
    ctaSecondary: z.string().optional(),
    features: z.array(iconCardSchema),
  }),
  dor: z.object({
    eyebrow: z.string(),
    headline: headlineSchema,
    intro: z.string(),
    cards: z.array(iconCardSchema),
  }),
  solucao: z.object({
    eyebrow: z.string(),
    headline: headlineSchema,
    sub: z.string(),
    cards: z.array(iconCardSchema),
  }),
  areas: z.object({
    eyebrow: z.string(),
    headline: headlineSchema,
    sub: z.string(),
    cards: z.array(areaCardSchema),
    cta: z.string().optional(),
  }),
  etapas: z
    .object({
      eyebrow: z.string(),
      headline: headlineSchema,
      steps: z.array(etapaItemSchema),
    })
    .optional(),
  faq: z.object({
    eyebrow: z.string(),
    headline: headlineSchema,
    items: z.array(faqItemSchema),
  }),
  ctaFinal: z.object({
    headline: headlineSchema,
    sub: z.string(),
    cta: z.string(),
  }),
  sobre: z
    .object({
      eyebrow: z.string(),
      headline: headlineSchema,
    })
    .optional(),
  seo: seoMetaSchema.optional(),
});

const officeSchema = z.object({
  name: z.string(),
  fullName: z.string(),
  product: z.string(),
  area: z.string(),
  city: z.string(),
  whatsapp: z.string(),
  whatsappDisplay: z.string(),
  email: z.string(),
  address: z.string(),
  mapsUrl: z.string(),
  extraAddresses: z.array(extraAddressSchema).optional(),
  extraContacts: z.array(extraContactSchema).optional(),
  tags: z
    .object({
      head: customScriptTagSchema,
      body: customScriptTagSchema,
      footer: customScriptTagSchema,
    })
    .optional(),
  tracking: trackingProviderConfigSchema.optional(),
  privacyPolicy: z.string().optional(),
  fonts: z.object({ heading: z.string(), body: z.string() }).optional(),
  cardRadius: z.enum(["rounded", "square"]).optional(),
  buttons: z
    .object({
      radius: z.enum(["rounded", "square"]),
      action: z.enum(["whatsapp", "link", "popup"]),
      link: z.string(),
      popup: z
        .object({
          questions: z.array(popupQuestionSchema),
        })
        .optional(),
    })
    .optional(),
  floatingButton: z
    .object({
      enabled: z.boolean(),
      action: z.enum(["whatsapp", "popup"]),
    })
    .optional(),
  about: z.string(),
  diferenciais: z.array(z.string()),
  logoSrc: z.string(),
  logoBg: logoBgSchema,
  lawyers: z.array(lawyerSchema),
  socials: z.array(socialSchema),
  sectionImages: z.object({
    hero: z.string(),
    // Ausente nas LPs criadas antes do campo existir — o editor normaliza para "".
    heroDestaque: z.string().default(""),
    dor: z.string(),
    sobre: z.string(),
    solucao: z.string(),
  }),
  // Enquadramento (ponto focal) das imagens de cenário — todas as chaves
  // opcionais; ausência = centro. Ausente nas LPs antigas.
  sectionImageFocals: z
    .object({
      hero: focalSchema,
      heroDestaque: focalSchema,
      dor: focalSchema,
      sobre: focalSchema,
      solucao: focalSchema,
    })
    .partial()
    .optional(),
  metrics: z.array(metricSchema),
  heroFeatures: z.array(heroFeatureSchema).optional(),
});

const layoutSchema = z.object({
  hero: z.enum(HERO_VARIANTS),
  dor: z.enum(DOR_VARIANTS),
  solucao: z.enum(SOLUCAO_VARIANTS),
  sobre: z.enum(SOBRE_VARIANTS),
  equipe: z.enum(EQUIPE_VARIANTS).optional(),
  areas: z.enum(AREAS_VARIANTS),
  etapas: z.enum(ETAPAS_VARIANTS),
  tones: z.object({
    hero: z.enum(["light", "dark"]),
    dor: z.enum(["light", "dark"]),
    solucao: z.enum(["light", "dark"]),
    sobre: z.enum(["light", "dark"]),
    equipe: z.enum(["light", "dark"]),
    areas: z.enum(["light", "dark"]),
    etapas: z.enum(["light", "dark"]),
    faq: z.enum(["light", "dark"]),
    ctaFinal: z.enum(["light", "dark"]),
  }),
  hidden: z
    .record(
      z.enum(["areas", "etapas", "faq", "ctaFinal", "equipe"]),
      z.boolean(),
    )
    .optional(),
  order: z.array(z.string()).optional(),
});

const customSectionSchema = z.object({
  id: z.string(),
  kind: z.enum(["cards", "texto", "youtube", "calendar", "maps"]),
  tone: z.enum(["light", "dark"]),
  eyebrow: z.string(),
  title: z.string(),
  text: z.string(),
  cards: z.array(z.object({ title: z.string(), text: z.string() })),
  youtubeId: z.string().optional(),
  calendarUrl: z.string().optional(),
  mapsUrl: z.string().optional(),
  variant: z.enum(["boxed", "fullWidth"]).optional(),
  cta: z.string().optional(),
  hidden: z.boolean().optional(),
});

/** Schema permissivo do editor — validação estrita só ao salvar/publicar. */
export const lpEditorFormSchema = z.object({
  office: officeSchema,
  theme: themeSchema,
  autoTheme: z.boolean(),
  tema: z.string(),
  layout: layoutSchema,
  videoId: z.string(),
  copy: focoCopySchema,
  customSections: z.array(customSectionSchema),
});

export type LpEditorFormValues = Omit<
  z.infer<typeof lpEditorFormSchema>,
  "office" | "theme" | "layout" | "copy" | "customSections"
> & {
  office: Office;
  theme: Theme;
  layout: Layout;
  copy: FocoCopy;
  customSections: CustomSection[];
};

export const EMPTY_OFFICE: LpEditorFormValues["office"] = {
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
  tracking: { ...DEFAULT_TRACKING },

  fonts: { heading: "", body: "" },
  cardRadius: "square",
  buttons: {
    radius: "square",
    action: "popup",
    link: "",
    popup: { questions: [] },
  },
  floatingButton: { enabled: true, action: "whatsapp" },
  about: "",
  diferenciais: [""],
  logoSrc: "",
  logoBg: DEFAULT_LOGO_BG,
  lawyers: [],
  socials: [{ network: "instagram", url: "" }],
  sectionImages: { ...EMPTY_SECTION_IMAGES },
  metrics: [],
  heroFeatures: [],
};

export function lpEditorDefaultValues(
  seed?: Partial<LpEditorFormValues>,
): LpEditorFormValues {
  const tema = seed?.tema ?? "";
  const copy = seed?.copy ?? focoGenerico();
  return {
    office: seed?.office
      ? {
          ...EMPTY_OFFICE,
          ...seed.office,
          socials: seed.office.socials?.length
            ? seed.office.socials
            : [{ network: "instagram", url: "" }],
          extraAddresses: seed.office.extraAddresses ?? [],
          extraContacts: seed.office.extraContacts ?? [],
          tags: seed.office.tags ?? { head: "", body: "", footer: "" },
          tracking: normalizeTracking(seed.office.tracking),

          fonts: seed.office.fonts ?? { heading: "", body: "" },
          cardRadius: seed.office.cardRadius ?? "square",
          buttons:
            normalizeOfficeButtons(seed.office.buttons) ?? EMPTY_OFFICE.buttons,
          heroFeatures:
            seed.office.heroFeatures ??
            (copy.hero.features ?? []).map((f) => ({
              icon: f.icon,
              text: f.title,
            })),
        }
      : EMPTY_OFFICE,
    theme: seed?.theme ?? DEFAULT_THEME,
    autoTheme: seed?.autoTheme ?? !!seed,
    tema,
    layout: seed?.layout ?? DEFAULT_LAYOUT,
    videoId: seed?.videoId ?? "",
    copy,
    customSections: seed?.customSections ?? [],
  };
}

/** Validação ao salvar/publicar a LP no editor. */
export const lpEditorSaveSchema = z
  .object({
    office: officeSchema.pick({
      name: true,
      whatsapp: true,
      whatsappDisplay: true,
      email: true,
    }),
    tema: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.office.name.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["office", "name"],
        message: "O nome do escritório é obrigatório",
      });
    }
    refineRequiredWhatsapp(ctx, data.office.whatsapp, ["office", "whatsapp"]);
    refineRequiredEmail(ctx, data.office.email, ["office", "email"]);
  });

export function validateLpEditorSave(
  values: LpEditorFormValues,
): z.ZodError | null {
  const result = lpEditorSaveSchema.safeParse(values);
  return result.success ? null : result.error;
}

/** Aplica erros de save nos campos do RHF (ex.: WhatsApp → whatsappDisplay). */
export function applyLpEditorSaveErrorsToForm(
  form: UseFormReturn<LpEditorFormValues>,
  error: z.ZodError,
) {
  for (const issue of error.issues) {
    let path = issue.path.join(".");
    if (path === "office.whatsapp") path = "office.whatsappDisplay";
    form.setError(path as FieldPath<LpEditorFormValues>, {
      message: issue.message,
    });
  }
}
