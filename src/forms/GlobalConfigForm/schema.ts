import { z } from "zod";

const ga4MeasurementIdSchema = z.string().trim().refine(
  (value) => value === "" || /^G-[A-Z0-9]+$/i.test(value),
  "Use um ID no formato G-XXXXXXXXXX.",
);

const gtmContainerIdSchema = z.string().trim().refine(
  (value) => value === "" || /^GTM-[A-Z0-9]+$/i.test(value),
  "Use um container no formato GTM-XXXXXXX.",
);

const metaPixelIdSchema = z.string().trim().refine(
  (value) => value === "" || /^\d+$/.test(value),
  "Use apenas numeros no Meta Pixel ID.",
);

const googleAdsIdSchema = z.string().trim().refine(
  (value) => value === "" || /^AW-\d+$/i.test(value),
  "Use um ID no formato AW-XXXXXXXXX.",
);

const domainSchema = z.string().trim().refine(
  (value) =>
    value === "" ||
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(
      value,
    ),
  "Informe apenas o dominio, sem protocolo ou caminhos.",
);

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
    domain: domainSchema,
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
