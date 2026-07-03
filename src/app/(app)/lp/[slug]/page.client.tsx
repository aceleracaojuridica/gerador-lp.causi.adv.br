"use client";

import { useEffect } from "react";
import { getConfigAction } from "@/app/actions/config";
import { Editor } from "@/components/Builder/editor";
import { type LpSeed, useLpForm } from "@/components/Builder/use-lp-form";
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
  const s = initial.schema;
  const seed: LpSeed = {
    office: s.office,
    theme: s.theme,
    layout: s.layout,
    videoId: s.videoId ?? "",
    tema: initial.tema,
    copy: {
      hero: s.hero,
      dor: s.dor,
      solucao: s.solucao,
      areas: s.areas,
      faq: s.faq,
      ctaFinal: s.ctaFinal,
      seo: s.seo,
    },
    customSections: s.customSections ?? [],
  };
  const form = useLpForm(seed, initial.slug);

  useEffect(() => {
    let alive = true;
    getConfigAction()
      .then((c) => {
        if (alive && c?.fonts) form.set("fonts", c.fonts);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [form.set]);

  return (
    <Container
      orientation="vertical"
      overflow="hidden"
      className="min-h-0 flex-1"
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Editor
          form={form}
          slug={initial.slug}
          officeSubdomain={initial.officeSubdomain}
          name={initial.name}
          status={initial.status ?? "draft"}
          startTour={startTour}
        />
      </div>
    </Container>
  );
}
