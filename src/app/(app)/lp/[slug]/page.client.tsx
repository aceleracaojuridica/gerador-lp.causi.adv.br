"use client";

import { useEffect } from "react";
import { Editor } from "@/components/Builder/editor";
import { Container } from "@/components/ui-patterns/container";
import { type LpSeed, useLpEditorForm } from "@/forms/LpEditorForm";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
} from "@/lib/landing-pages/global-config";
import type { StoredLp } from "@/lib/landing-pages/schema";

type LpEditorPageClientProps = {
  initial: StoredLp;
  initialAccountConfig: GlobalConfig;
};

export function LpEditorPageClient({
  initial,
  initialAccountConfig,
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
  const lpForm = useLpEditorForm(seed);
  const { applyAccountDefaults } = lpForm;
  const accountConfig = initialAccountConfig ?? DEFAULT_CONFIG;

  useEffect(() => {
    applyAccountDefaults(accountConfig);
  }, [accountConfig, applyAccountDefaults]);

  return (
    <Container
      orientation="vertical"
      overflow="hidden"
      className="min-h-0 flex-1"
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Editor
          form={lpForm}
          slug={initial.slug}
          officeSubdomain={initial.officeSubdomain}
          name={initial.name}
          status={initial.status ?? "draft"}
          initialAccountConfig={accountConfig}
        />
      </div>
    </Container>
  );
}
