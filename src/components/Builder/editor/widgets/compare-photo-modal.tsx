"use client";

import { Check, Close } from "@material-symbols-svg/react";

export function ComparePhotoModal({
  before,
  after,
  beforeDim,
  afterDim,
  onApply,
  onDiscard,
}: {
  before: string;
  after: string;
  beforeDim: { width: number; height: number };
  afterDim: { width: number; height: number };
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <>
      <button
        type="button"
        aria-label="Fechar comparação"
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onDiscard}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-photo-title"
          className="pointer-events-auto flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2
                id="compare-photo-title"
                className="text-sm font-semibold text-foreground"
              >
                Comparar a foto
              </h2>
              <p className="text-xs text-ui-gray">
                Mesma pessoa, com mais nitidez e resolução:{" "}
                <strong>
                  {beforeDim.width}×{beforeDim.height}
                </strong>{" "}
                →{" "}
                <strong className="text-ui">
                  {afterDim.width}×{afterDim.height}
                </strong>
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar"
              onClick={onDiscard}
              className="min-h-11 min-w-11 rounded-lg p-1.5 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <Close size={18} />
            </button>
          </div>

          <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
            <figure className="flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                Atual · {beforeDim.width}×{beforeDim.height}
              </span>
              {/* biome-ignore lint/performance/noImgElement: preview local de comparação antes/depois */}
              <img
                src={before}
                alt="foto atual"
                className="max-h-[62vh] w-full rounded-lg bg-muted object-contain ring-1 ring-border"
              />
            </figure>
            <figure className="flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui">
                Melhorada · {afterDim.width}×{afterDim.height}
              </span>
              {/* biome-ignore lint/performance/noImgElement: preview local de comparação antes/depois */}
              <img
                src={after}
                alt="foto melhorada"
                className="max-h-[62vh] w-full rounded-lg bg-muted object-contain ring-2 ring-ui"
              />
            </figure>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
            <button
              type="button"
              onClick={onDiscard}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <Close size={15} /> Descartar
            </button>
            <button
              type="button"
              onClick={onApply}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-ui px-5 py-2 text-sm font-semibold text-white transition hover:bg-ui-dark"
            >
              <Check size={15} /> Aplicar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
