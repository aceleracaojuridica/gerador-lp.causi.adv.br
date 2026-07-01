"use client";

import { toast } from "sonner";
import {
  AUTH_EMAIL_FALLBACK,
  AUTH_EMAIL_PROVIDERS,
} from "@/lib/constants/auth-email";

export function showAuthEmailToast(
  email: string,
  title: string,
  description?: string,
) {
  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  const emailProvider = AUTH_EMAIL_PROVIDERS.find((provider) => {
    if ("domainIncludes" in provider && provider.domainIncludes) {
      return provider.domainIncludes.some((fragment) =>
        emailDomain.includes(fragment),
      );
    }

    if ("domainRegex" in provider && provider.domainRegex) {
      return provider.domainRegex.test(emailDomain);
    }

    return false;
  });

  const emailLabel = emailProvider?.label ?? AUTH_EMAIL_FALLBACK.label;
  const emailUrl = emailProvider?.url ?? AUTH_EMAIL_FALLBACK.url;

  toast.success(title, {
    description,
    action: {
      label: emailLabel,
      onClick: () => window.open(emailUrl, "_blank", "noopener,noreferrer"),
    },
  });
}
