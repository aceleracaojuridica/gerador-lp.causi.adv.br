"use client";

import { useEffect } from "react";
import { getConfigAction } from "@/app/actions/config";
import type { StoredLp } from "@/lib/landing-pages/schema";
import { Editor } from "./editor";
import { type LpSeed, useLpForm } from "./use-lp-form";

/**
 * Abre uma LP já gerada (pelo Claude) no editor/preview. O frontend só exibe e
 * deixa ajustar; não gera copy.
 */
export function LpStudio({
  initial,
  startTour,
}: {
  initial: StoredLp;
  startTour?: boolean;
}) {
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

  // Tipografia é GLOBAL (config.json): ao abrir, aplica no preview a fonte
  // configurada na galeria, sobrescrevendo a salva na LP. Roda só no mount.
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
    <Editor
      form={form}
      slug={initial.slug}
      name={initial.name}
      status={initial.status ?? "draft"}
      startTour={startTour}
    />
  );
}
