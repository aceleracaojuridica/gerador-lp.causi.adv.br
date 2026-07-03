"use client";

import { ChevronLeft, ChevronRight } from "@material-symbols-svg/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    <div className="@container min-w-0 max-w-full flex flex-col gap-2">
      <div
        className={cn(
          "flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {total > 1 ? (
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Variante anterior"
              onClick={prev}
              className="min-h-11 min-w-11 shrink-0 text-muted-foreground"
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground sm:max-w-36">
              {variantLabels[current] ?? current} — {idx + 1}/{total}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Próxima variante"
              onClick={next}
              className="min-h-11 min-w-11 shrink-0 text-muted-foreground"
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        ) : (
          <span className="truncate text-xs text-muted-foreground">
            {variantLabels[current] ?? current}
          </span>
        )}
      </div>
      {thumb ? (
        <div className="aspect-[16/10] w-full overflow-hidden rounded-lg bg-muted ring-1 ring-inset ring-border">
          {thumb}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Carrossel de variantes de seção: exibe a seção atual com botões ← →
 * para ciclar entre as variações disponíveis.
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
        className="flex items-center justify-between border-y border-border bg-muted/50 px-4 py-2.5"
      />
      {children(current)}
    </div>
  );
}
