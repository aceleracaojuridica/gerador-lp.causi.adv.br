"use client";

import { ProgressActivity, WandStars } from "@material-symbols-svg/react";
import { useState } from "react";
import { LazyImageSlot } from "@/components/Builder/shared/image-picker-dialog";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { SectionImageKey } from "@/lib/landing-pages/schema";

export function SectionImageInput({
  form,
  sectionKey,
  label,
}: {
  form: LpEditorForm;
  sectionKey: SectionImageKey;
  label?: string;
}) {
  const src = form.office.sectionImages[sectionKey];
  const [loadingIA, setLoadingIA] = useState(false);

  async function iaEscolhe() {
    setLoadingIA(true);
    try {
      const res = await fetch("/api/imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: form.tema, sectionKey, current: src }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (data.url) form.setSectionImageUrl(sectionKey, data.url);
    } catch {
      /* mantém imagem atual */
    } finally {
      setLoadingIA(false);
    }
  }

  return (
    <LazyImageSlot
      src={src}
      label={label ?? "Imagem da seção"}
      onChange={(url) => form.setSectionImageUrl(sectionKey, url)}
      onClear={() => form.clearSectionImage(sectionKey)}
      extraActions={
        <button
          type="button"
          onClick={iaEscolhe}
          disabled={loadingIA}
          title="Busca uma imagem relacionada ao tema da página"
          className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-ui/30 bg-ui-soft px-2.5 py-1.5 text-xs font-medium text-ui transition hover:bg-ui/15 disabled:opacity-60"
        >
          {loadingIA ? (
            <ProgressActivity size={14} className="animate-spin" />
          ) : (
            <WandStars size={14} />
          )}
          {loadingIA ? "Buscando…" : "IA escolhe"}
        </button>
      }
    />
  );
}
