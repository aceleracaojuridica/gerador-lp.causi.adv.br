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

const popupQuestionBaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().optional(),
});

function coercePopupQuestion(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const q = raw as Record<string, unknown>;
  const type = q.type;
  if (type !== "choice") {
    const { options: _options, allowMultiple: _allowMultiple, ...rest } = q;
    return rest;
  }
  if (!Array.isArray(q.options)) {
    return { ...q, options: [] };
  }
  return q;
}

const popupQuestionUnionSchema = z.discriminatedUnion("type", [
  popupQuestionBaseSchema.extend({ type: z.literal("text") }),
  popupQuestionBaseSchema.extend({ type: z.literal("number") }),
  popupQuestionBaseSchema.extend({ type: z.literal("phone") }),
  popupQuestionBaseSchema.extend({ type: z.literal("email") }),
  popupQuestionBaseSchema.extend({ type: z.literal("url") }),
  popupQuestionBaseSchema.extend({ type: z.literal("cep") }),
  popupQuestionBaseSchema.extend({
    type: z.literal("currency"),
    currency: z.enum(["BRL", "USD", "EUR"]),
  }),
  popupQuestionBaseSchema.extend({
    type: z.literal("choice"),
    options: z.array(z.string()),
    allowMultiple: z.boolean().optional(),
  }),
]);

export const popupQuestionSchema = z.preprocess(
  coercePopupQuestion,
  popupQuestionUnionSchema,
);
