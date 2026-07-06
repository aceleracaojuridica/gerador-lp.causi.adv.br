import type { FieldPath, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { DEFAULT_LOGO_BG } from "@/lib/landing-pages/colors";
import { DEFAULT_THEME } from "@/lib/landing-pages/schema";

const socialNetworkSchema = z.enum([
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "linkedin",
]);

const addressEntrySchema = z.object({
  address: z.string(),
  uf: z.string(),
  cidade: z.string(),
  mapsUrl: z.string(),
  showMaps: z.boolean(),
});

const lawyerSchema = z.object({
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

const logoBgSchema = z.object({
  type: z.enum(["transparent", "light", "dark"]),
  color: z.string(),
});

const themeSchema = z.object({
  brand: z.string(),
  brandDark: z.string(),
  accent: z.string(),
  accentSoft: z.string(),
  cream: z.string(),
  creamDeep: z.string(),
  ink: z.string(),
  inkSoft: z.string(),
});

/** Schema base — tipagem e valores default; validação por passo em `step0Schema` / `step1Schema`. */
export const landingPageCreateFormSchema = z.object({
  tema: z.string(),
  name: z.string(),
  about: z.string(),
  diferenciais: z.array(z.object({ val: z.string() })),
  whatsapp: z.string(),
  whatsappDisplay: z.string(),
  email: z.string(),
  showAddress: z.boolean(),
  addresses: z.array(addressEntrySchema),
  showSocials: z.boolean(),
  socials: z.array(
    z.object({
      network: socialNetworkSchema,
      url: z.string(),
    }),
  ),
  showVideo: z.boolean(),
  videoId: z.string(),
  logoSrc: z.string(),
  logoBg: logoBgSchema,
  theme: themeSchema,
  autoTheme: z.boolean(),
  lawyers: z.array(lawyerSchema),
});

export type LandingPageCreateFormValues = z.infer<
  typeof landingPageCreateFormSchema
>;

export function landingPageCreateDefaultValues(): LandingPageCreateFormValues {
  return {
    tema: "",
    name: "",
    about: "",
    diferenciais: [{ val: "" }],
    whatsapp: "",
    whatsappDisplay: "",
    email: "",
    showAddress: true,
    addresses: [
      { address: "", uf: "", cidade: "", mapsUrl: "", showMaps: false },
    ],
    showSocials: true,
    socials: [{ network: "instagram", url: "" }],
    showVideo: false,
    videoId: "",
    logoSrc: "",
    logoBg: DEFAULT_LOGO_BG,
    theme: DEFAULT_THEME,
    autoTheme: false,
    lawyers: [{ photo: "", name: "", role: "" }],
  };
}

export const step0Schema = z.object({
  tema: z.string().trim().min(1, "O campo é obrigatório"),
  name: z.string().trim().min(1, "O campo é obrigatório"),
  about: z.string().trim().min(1, "O campo é obrigatório"),
});

export const step1Schema = z
  .object({
    whatsapp: z.string(),
    whatsappDisplay: z.string(),
    email: z.string(),
    showAddress: z.boolean(),
    addresses: z.array(addressEntrySchema),
    showSocials: z.boolean(),
    socials: z.array(
      z.object({
        network: socialNetworkSchema,
        url: z.string(),
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.whatsapp.length !== 13) {
      ctx.addIssue({
        code: "custom",
        path: ["whatsapp"],
        message:
          data.whatsapp.length === 0
            ? "O campo é obrigatório"
            : "Informe DDD + 9 dígitos",
      });
    }

    const email = data.email.trim();
    if (!email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "O campo é obrigatório",
      });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "E-mail inválido",
      });
    }

    data.addresses.forEach((a, i) => {
      const maps = a.mapsUrl.trim();
      if (maps && !maps.toLowerCase().startsWith("https://")) {
        ctx.addIssue({
          code: "custom",
          path: ["addresses", i, "mapsUrl"],
          message: "O link deve começar com https://",
        });
      }
    });

    if (
      data.socials.some((s) => {
        const url = s.url.trim();
        return url.length > 0 && !url.toLowerCase().startsWith("https://");
      })
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["socials"],
        message: "Os links das redes sociais devem começar com https://",
      });
    }
  });

export function applyZodErrorsToForm(
  form: UseFormReturn<LandingPageCreateFormValues>,
  error: z.ZodError,
) {
  for (const issue of error.issues) {
    const path = issue.path.join(".") as FieldPath<LandingPageCreateFormValues>;
    form.setError(path, { message: issue.message });
  }
}

export function validateWizardStep(
  step: number,
  values: LandingPageCreateFormValues,
): z.ZodError | null {
  if (step === 0) {
    const result = step0Schema.safeParse(values);
    return result.success ? null : result.error;
  }
  if (step === 1) {
    const result = step1Schema.safeParse(values);
    return result.success ? null : result.error;
  }
  return null;
}
