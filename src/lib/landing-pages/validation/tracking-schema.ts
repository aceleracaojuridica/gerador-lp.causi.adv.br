import { z } from "zod";

const ga4TrackingSchema = z.object({
  enabled: z.boolean(),
  measurementId: z.string().trim(),
});

const gtmTrackingSchema = z.object({
  enabled: z.boolean(),
  containerId: z.string().trim(),
});

const metaPixelTrackingSchema = z.object({
  enabled: z.boolean(),
  pixelId: z.string().trim(),
});

const googleAdsTrackingSchema = z.object({
  enabled: z.boolean(),
  adsId: z.string().trim(),
  conversionLabel: z.string().trim(),
});

export const trackingProviderConfigSchema = z.object({
  ga4: ga4TrackingSchema,
  gtm: gtmTrackingSchema,
  metaPixel: metaPixelTrackingSchema,
  googleAds: googleAdsTrackingSchema,
});

export type TrackingProviderConfigInput = z.infer<
  typeof trackingProviderConfigSchema
>;

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

/** Validação estrita dos IDs quando o provedor está ativo. */
export const trackingProviderConfigStrictSchema =
  trackingProviderConfigSchema.superRefine((value, ctx) => {
    if (value.ga4.enabled && value.ga4.measurementId) {
      const res = ga4MeasurementIdSchema.safeParse(value.ga4.measurementId);
      if (!res.success) {
        ctx.addIssue({
          code: "custom",
          path: ["ga4", "measurementId"],
          message: res.error.issues[0]?.message ?? "ID invalido.",
        });
      }
    }
    if (value.gtm.enabled && value.gtm.containerId) {
      const res = gtmContainerIdSchema.safeParse(value.gtm.containerId);
      if (!res.success) {
        ctx.addIssue({
          code: "custom",
          path: ["gtm", "containerId"],
          message: res.error.issues[0]?.message ?? "ID invalido.",
        });
      }
    }
    if (value.metaPixel.enabled && value.metaPixel.pixelId) {
      const res = metaPixelIdSchema.safeParse(value.metaPixel.pixelId);
      if (!res.success) {
        ctx.addIssue({
          code: "custom",
          path: ["metaPixel", "pixelId"],
          message: res.error.issues[0]?.message ?? "ID invalido.",
        });
      }
    }
    if (value.googleAds.enabled && value.googleAds.adsId) {
      const res = googleAdsIdSchema.safeParse(value.googleAds.adsId);
      if (!res.success) {
        ctx.addIssue({
          code: "custom",
          path: ["googleAds", "adsId"],
          message: res.error.issues[0]?.message ?? "ID invalido.",
        });
      }
    }
  });
