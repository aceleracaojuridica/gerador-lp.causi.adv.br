"use client";

import { LpStudio } from "@/components/Builder/lp-studio";
import { Container } from "@/components/ui-patterns/container";
import type { StoredLp } from "@/lib/landing-pages/schema";

type LpEditorPageClientProps = {
  initial: StoredLp;
  startTour?: boolean;
};

export function LpEditorPageClient({
  initial,
  startTour,
}: LpEditorPageClientProps) {
  return (
    <Container orientation="vertical" overflow="hidden" className="min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <LpStudio initial={initial} startTour={startTour} />
      </div>
    </Container>
  );
}
