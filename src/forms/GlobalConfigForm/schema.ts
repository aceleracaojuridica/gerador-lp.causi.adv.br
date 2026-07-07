import { z } from "zod";

const ga4MeasurementIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^G-[A-Z0-9]+$/i.test(value),
    "Use um ID no formato G-XXXXXXXXXX.",
  );

const gtmContainerIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^GTM-[A-Z0-9]+$/i.test(value),
    "Use um container no formato GTM-XXXXXXX.",
  );

const metaPixelIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Use apenas numeros no Meta Pixel ID.",
  );

const googleAdsIdSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^AW-\d+$/i.test(value),
    "Use um ID no formato AW-XXXXXXXXX.",
  );

const addressSchema = z.object({
  address: z.string().trim(),
  cidade: z.string().trim(),
  uf: z.string().trim(),
  mapsUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https:\/\//i.test(value),
      "O link deve começar com https://",
    ),
});

const contactSchema = z.object({
  whatsapp: z.string().trim(),
  whatsappDisplay: z.string().trim(),
  email: z.string().trim(),
});

const socialNetworkSchema = z.enum([
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "linkedin",
]);

const socialItemSchema = z.object({
  network: socialNetworkSchema,
  url: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https:\/\//i.test(value),
      "O link deve começar com https://",
    ),
});

export const globalConfigFormSchema = z
  .object({
    fonts: z.object({
      heading: z.string(),
      body: z.string(),
    }),
    tracking: z.object({
      ga4MeasurementId: ga4MeasurementIdSchema,
      gtmContainerId: gtmContainerIdSchema,
      metaPixelId: metaPixelIdSchema,
      googleAdsId: googleAdsIdSchema,
      googleAdsLabel: z.string().trim(),
    }),
    tags: z.object({
      head: z.string(),
      body: z.string(),
      footer: z.string(),
    }),
    captcha: z.object({
      provider: z.enum(["none", "turnstile"]),
      siteKey: z.string().trim(),
      widgetTheme: z.enum(["auto", "light", "dark"]),
    }),
    address: addressSchema.optional(),
    contact: contactSchema.optional(),
    socials: z.array(socialItemSchema).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.captcha.provider === "turnstile" && !value.captcha.siteKey) {
      ctx.addIssue({
        code: "custom",
        path: ["captcha", "siteKey"],
        message: "A site key e obrigatoria quando o Turnstile estiver ativo.",
      });
    }
  });
