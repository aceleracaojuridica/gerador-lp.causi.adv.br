import { z } from "zod";
import { validateCustomScript } from "./script-validator";

export const customScriptTagSchema = z.string().superRefine((val, ctx) => {
  const res = validateCustomScript(val);
  if (!res.valid) {
    for (const err of res.errors) {
      ctx.addIssue({ code: "custom", message: err });
    }
  }
});

export const socialNetworkSchema = z.enum([
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "linkedin",
]);

export const addressEntrySchema = z.object({
  address: z.string(),
  uf: z.string(),
  cidade: z.string(),
  mapsUrl: z.string(),
  showMaps: z.boolean(),
});

export const lawyerSchema = z.object({
  photo: z.string(),
  name: z.string(),
  role: z.string(),
  focal: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

export const logoBgSchema = z.object({
  type: z.enum(["transparent", "light", "dark"]),
  color: z.string(),
});

export const themeSchema = z.object({
  brand: z.string(),
  brandDark: z.string(),
  accent: z.string(),
  accentSoft: z.string(),
  cream: z.string(),
  creamDeep: z.string(),
  ink: z.string(),
  inkSoft: z.string(),
});

export const socialSchema = z.object({
  network: socialNetworkSchema,
  url: z.string(),
});

export const extraAddressSchema = z.object({
  address: z.string(),
  city: z.string(),
  mapsUrl: z.string(),
});

export const extraContactSchema = z.object({
  whatsapp: z.string(),
  whatsappDisplay: z.string(),
  email: z.string(),
});

export const metricSchema = z.object({
  icon: z.string(),
  label: z.string(),
});

export const heroFeatureSchema = z.object({
  icon: z.string(),
  text: z.string(),
});

export const popupQuestionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "choice"]),
  options: z.array(z.string()),
});
