import { z } from "zod";
import { validateCustomScript } from "@/lib/landing-pages/validation/script-validator";
import { trackingProviderConfigStrictSchema } from "@/lib/landing-pages/validation/tracking-schema";

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

export const globalConfigFormSchema = z.object({
  fonts: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  tracking: trackingProviderConfigStrictSchema,
  tags: z.object({
    head: z.string().superRefine((val, ctx) => {
      const res = validateCustomScript(val);
      if (!res.valid) {
        for (const err of res.errors) {
          ctx.addIssue({ code: "custom", message: err });
        }
      }
    }),
    body: z.string().superRefine((val, ctx) => {
      const res = validateCustomScript(val);
      if (!res.valid) {
        for (const err of res.errors) {
          ctx.addIssue({ code: "custom", message: err });
        }
      }
    }),
    footer: z.string().superRefine((val, ctx) => {
      const res = validateCustomScript(val);
      if (!res.valid) {
        for (const err of res.errors) {
          ctx.addIssue({ code: "custom", message: err });
        }
      }
    }),
  }),
  address: addressSchema.optional(),
  contact: contactSchema.optional(),
  socials: z.array(socialItemSchema).optional(),
});
