"use client";

import { ChevronLeft, ChevronRight } from "@material-symbols-svg/react";
import { cn } from "@/lib/utils";

type ControlsProps = {
  label: string;
  variants: readonly string[];
  current: string;
  onChange: (v: string) => void;
  className?: string;
};

/** Pílula discreta ← → para ciclar as variantes de uma seção. */
export function SectionVariantControls({
  label,
  variants,
  current,
  onChange,
  className,
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
    <fieldset
      aria-label={`Variação de ${label}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/85 p-1 shadow-md backdrop-blur-md",
        className,
      )}
    >
      <span className="shrink-0 px-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        aria-label="Variante anterior"
        onClick={prev}
        disabled={total <= 1}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="min-w-7 shrink-0 text-center text-[10px] font-medium tabular-nums text-muted-foreground">
        {idx + 1}/{total}
      </span>
      <button
        type="button"
        aria-label="Próxima variante"
        onClick={next}
        disabled={total <= 1}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
      >
        <ChevronRight size={14} />
      </button>
    </fieldset>
  );
}
