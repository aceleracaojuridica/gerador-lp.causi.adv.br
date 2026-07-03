"use client";

import { Container } from "@/components/ui-patterns/container";
import { LandingPageCreateForm } from "@/forms/LandingPageCreateForm";

export function NovaPageClient() {
  return (
    <Container
      orientation="vertical"
      overflow="hidden"
      className="min-h-0 w-full flex-1"
    >
      <LandingPageCreateForm />
    </Container>
  );
}
