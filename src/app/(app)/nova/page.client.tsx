"use client";

import { Container } from "@/components/ui-patterns/container";
import { LandingPageCreateForm } from "@/forms/LandingPageCreateForm";

interface NovaPageClientProps {
  defaultOfficeName: string;
  savedAddresses: any[];
  savedContacts: any[];
  savedSocials: any[];
}

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
