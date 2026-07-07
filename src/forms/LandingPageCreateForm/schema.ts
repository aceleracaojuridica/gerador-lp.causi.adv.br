import type { FieldPath, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { DEFAULT_LOGO_BG } from "@/lib/landing-pages/colors";
import { DEFAULT_THEME } from "@/lib/landing-pages/schema";
import {
  refineRequiredEmail,
  refineRequiredWhatsapp,
} from "@/lib/landing-pages/validation/contact";
import {
  addressEntrySchema,
  lawyerSchema,
  logoBgSchema,
  socialNetworkSchema,
  themeSchema,
} from "@/lib/landing-pages/zod-shared";
import type { LandingPageCreateFormProps } from "./landing-page-create-form.types";

/** Schema base — tipagem e valores default; validação por passo em `step0Schema` / `step1Schema`. */
export const landingPageCreateFormSchema = z.object({
  tema: z.string(),
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

export function landingPageCreateDefaultValues(
  props?: LandingPageCreateFormProps,
): LandingPageCreateFormValues {
  const primaryContact = props?.savedContacts?.find((c) => c.is_primary);
  const primaryAddress = props?.savedAddresses?.find((a) => a.is_primary);
  const primarySocials = props?.savedSocials?.filter((s) => s.is_primary) || [];

  return {
    tema: "",
    about: "",
    diferenciais: [{ val: "" }],
    whatsapp: primaryContact?.whatsapp ?? "",
    whatsappDisplay: primaryContact?.whatsapp_display ?? "",
    email: primaryContact?.email ?? "",
    showAddress: true,
    addresses: primaryAddress
      ? [
          {
            address: primaryAddress.address,
            uf: primaryAddress.uf,
            cidade: primaryAddress.cidade,
            mapsUrl: primaryAddress.maps_url ?? "",
            showMaps: !!primaryAddress.maps_url,
          },
        ]
      : [{ address: "", uf: "", cidade: "", mapsUrl: "", showMaps: false }],
    showSocials: true,
    socials:
      primarySocials.length > 0
        ? primarySocials.map((s) => ({ network: s.network, url: s.url }))
        : [{ network: "instagram", url: "" }],
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
