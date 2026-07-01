"use client";

import { ChevronLeft, ChevronRight } from "@material-symbols-svg/react";
import type { ReactNode } from "react";

type Props = {
  label: string;
  variants: readonly string[];
  variantLabels: Record<string, string>;
  current: string;
  onChange: (v: string) => void;
  children: (variant: string) => ReactNode;
};

type ControlsProps = {
  label: string;
  variants: readonly string[];
  variantLabels: Record<string, string>;
  current: string;
  onChange: (v: string) => void;
  className?: string;
  /** Miniatura esquemática da variante atual, exibida sob a barra de setas. */
  thumb?: ReactNode;
};

/** Barra ← → para ciclar variantes (sem renderizar a seção). */
export function SectionVariantControls({
  label,
  variants,
  variantLabels,
  current,
  onChange,
  className,
  thumb,
}: ControlsProps) {
  const idx = Math.max(0, variants.indexOf(current));
  const total = variants.length;

  function prev() {
    onChange(variants[(idx - 1 + total) % total]);
  }

  function next() {
    onChange(variants[(idx + 1) % total]);
  }

  return (
    <div className="min-w-0 max-w-full space-y-2">
      <div
        className={
          className ??
          "flex min-w-0 flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {total > 1 ? (
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:justify-center">
            <button
              type="button"
              aria-label="Variante anterior"
              onClick={prev}
              className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-0 flex-1 truncate text-center text-xs text-slate-500 sm:max-w-36">
              {variantLabels[current] ?? current} — {idx + 1}/{total}
            </span>
            <button
              type="button"
              aria-label="Próxima variante"
              onClick={next}
              className="shrink-0 rounded-md p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <span className="truncate text-xs text-slate-400">
            {variantLabels[current] ?? current}
          </span>
        )}
      </div>
      {thumb ? (
        <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-50 ring-1 ring-inset ring-slate-200 transition-opacity">
          {thumb}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Carrossel de variantes de seção: exibe a seção atual com botões ← →
 * para ciclar entre as variações disponíveis. Barra de controle fica acima
 * da seção com rótulo e indicador "variante N/total".
 */
export function SectionVariantCarousel({
  label,
  variants,
  variantLabels,
  current,
  onChange,
  children,
}: Props) {
  return (
    <div>
      <SectionVariantControls
        label={label}
        variants={variants}
        variantLabels={variantLabels}
        current={current}
        onChange={onChange}
        className="flex items-center justify-between border-y border-slate-200 bg-slate-50 px-4 py-2.5"
      />
      {children(current)}
    </div>
  );
}
