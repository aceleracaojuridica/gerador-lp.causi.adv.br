"use client";

import { Container } from "@/components/ui-patterns/container";
import { PageContent } from "@/components/ui-patterns/page-content";
import { LandingPageCreateForm } from "@/forms/LandingPageCreateForm";

type NovaPageClientProps = {
  initialTemplateId?: string;
};

export function NovaPageClient({ initialTemplateId }: NovaPageClientProps) {
  return (
    <Container
      orientation="vertical"
      overflow="hidden"
      className="min-h-0 w-full flex-1"
    >
      <PageContent className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-0">
        <LandingPageCreateForm initialTemplateId={initialTemplateId} />
      </PageContent>
    </Container>
  );
}
