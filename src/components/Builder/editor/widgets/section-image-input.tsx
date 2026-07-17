"use client";

import {
  Check,
  OpenWith,
  ProgressActivity,
  Undo,
  WandStars,
} from "@material-symbols-svg/react";
import { useState } from "react";
import { LazyImageSlot } from "@/components/Builder/shared/image-picker-dialog";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { SectionImageKey } from "@/lib/landing-pages/schema";
import { FocalDragSurface } from "./focal-drag-surface";

export function SectionImageInput({
  form,
  sectionKey,
  label,
  framable = false,
}: {
  form: LpEditorForm;
  sectionKey: SectionImageKey;
  label?: string;
  /** Mostra a ação de reenquadrar a imagem (reposiciona o ponto focal). */
  framable?: boolean;
}) {
  const src = form.office.sectionImages[sectionKey];
  const focal = form.office.sectionImageFocals?.[sectionKey] ?? {
    x: 50,
    y: 50,
  };
  const [loadingIA, setLoadingIA] = useState(false);
  const [framing, setFraming] = useState(false);

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

  // Enquadrar só faz sentido com imagem; ao trocá-la, o focal é descartado no
  // form — mas garantimos aqui sair do modo enquadramento.
  const canFrame = framable && Boolean(src);

  return (
    <LazyImageSlot
      src={src}
      label={label ?? "Imagem da seção"}
      onChange={(url) => {
        form.setSectionImageUrl(sectionKey, url);
        setFraming(false);
      }}
      onClear={() => {
        form.clearSectionImage(sectionKey);
        setFraming(false);
      }}
      overlay={
        canFrame ? (
          framing ? (
            <>
              <FocalDragSurface
                src={src}
                value={focal}
                onChange={(v) => form.setSectionImageFocal(sectionKey, v)}
                className="absolute inset-0 rounded-[5px] ring-2 ring-ui"
              />
              <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
                Arraste para reposicionar
              </span>
              <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    form.setSectionImageFocal(sectionKey, { x: 50, y: 50 })
                  }
                  title="Centralizar o enquadramento"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
                >
                  <Undo size={14} /> Centralizar
                </button>
                <button
                  type="button"
                  onClick={() => setFraming(false)}
                  aria-label="Concluir enquadramento"
                  title="Concluir o enquadramento"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm backdrop-blur transition hover:bg-emerald-600"
                >
                  <Check size={16} />
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setFraming(true)}
              aria-label="Enquadrar"
              title="Reposiciona a imagem para o enquadramento não cortar o que importa"
              className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <OpenWith size={16} />
            </button>
          )
        ) : undefined
      }
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
