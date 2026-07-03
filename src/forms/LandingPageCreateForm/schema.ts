import type { FieldPath, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import {
  refineRequiredEmail,
  refineRequiredWhatsapp,
} from "@/lib/landing-pages/validation/contact";
import { DEFAULT_LOGO_BG } from "@/lib/landing-pages/colors";
import { DEFAULT_THEME } from "@/lib/landing-pages/schema";
import {
  addressEntrySchema,
  lawyerSchema,
  logoBgSchema,
  socialNetworkSchema,
  themeSchema,
} from "@/lib/landing-pages/zod-shared";

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
    lawyers: [],
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
    refineRequiredWhatsapp(ctx, data.whatsapp, ["whatsapp"], {
      emptyMessage: "O campo é obrigatório",
    });
    refineRequiredEmail(ctx, data.email, ["email"], {
      emptyMessage: "O campo é obrigatório",
    });

    if (data.showAddress) {
      const primary = data.addresses[0];
      const hasAddress =
        (primary?.address.trim().length ?? 0) > 0 ||
        (primary?.cidade.trim().length ?? 0) > 0;
      if (!hasAddress) {
        ctx.addIssue({
          code: "custom",
          path: ["addresses"],
          message: "Preencha ao menos o endereço ou a cidade",
        });
      }
    }

    if (
      data.showSocials &&
      !data.socials.some((s) => s.url.trim().length > 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["socials"],
        message: "Adicione ao menos uma rede social com link",
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
