"use client";

import { Container } from "@/components/ui-patterns/container";
import {
  LandingPageCreateForm,
  type LandingPageCreateFormProps,
} from "@/forms/LandingPageCreateForm";

type NovaPageClientProps = Pick<
  LandingPageCreateFormProps,
  "defaultOfficeName" | "savedAddresses" | "savedContacts" | "savedSocials"
> & {
  defaultOfficeName: string;
  savedAddresses: NonNullable<LandingPageCreateFormProps["savedAddresses"]>;
  savedContacts: NonNullable<LandingPageCreateFormProps["savedContacts"]>;
  savedSocials: NonNullable<LandingPageCreateFormProps["savedSocials"]>;
};

export function NovaPageClient({
  defaultOfficeName,
  savedAddresses,
  savedContacts,
  savedSocials,
}: NovaPageClientProps) {
  return (
    <Container
      orientation="vertical"
      overflow="hidden"
      className="min-h-0 w-full flex-1"
    >
      <LandingPageCreateForm
        defaultOfficeName={defaultOfficeName}
        savedAddresses={savedAddresses}
        savedContacts={savedContacts}
        savedSocials={savedSocials}
      />
    </Container>
  );
}
