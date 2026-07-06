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
  thumbPlacement?: "below" | "inline";
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
  thumbPlacement = "below",
}: ControlsProps) {
  const idx = Math.max(0, variants.indexOf(current));
  const total = variants.length;
  const currentLabel = variantLabels[current] ?? current;
  const showInlineThumb = thumbPlacement === "inline" && thumb;
  const showBelowThumb = thumbPlacement === "below" && thumb;

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
          "inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-border/70 bg-background/92 p-1 shadow-sm backdrop-blur-md",
          className,
        )}
      >
        <span className="shrink-0 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        {total > 1 ? (
          <div className="flex min-w-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Variante anterior"
              onClick={prev}
              className="shrink-0 rounded-full text-muted-foreground"
            >
              <ChevronLeft size={16} />
            </Button>
            <div className="flex min-w-0 items-center gap-2 rounded-full bg-muted/55 px-2.5 py-1">
              {showInlineThumb ? (
                <div className="flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/80 bg-background shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                  {thumb}
                </div>
              ) : null}
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium text-foreground">
                  {currentLabel}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {idx + 1} de {total}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Próxima variante"
              onClick={next}
              className="shrink-0 rounded-full text-muted-foreground"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : (
          <span className="truncate px-2 text-xs text-muted-foreground">
            {currentLabel}
          </span>
        )}
      </div>
      {showBelowThumb ? (
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
        options={variants.map((variant) => ({
          id: variant,
          label: variantLabels[variant] ?? variant,
        }))}
        className="flex items-center justify-between border-y border-border bg-muted/50 px-4 py-2.5"
      />
      {children(current)}
    </div>
  );
}
