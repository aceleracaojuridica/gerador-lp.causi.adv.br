"use client";

import { ChevronLeft, ChevronRight } from "@material-symbols-svg/react";
import { cn } from "@/lib/utils";
import type { PreviewVariantControl } from "./constants";

type SectionVariantPickerProps = {
  control: PreviewVariantControl;
};

/**
 * Seletor de layout da seção, exibido nos campos do painel CMS: uma linha
 * nativa (label + controle) com um slider discreto de pontos entre as
 * variantes disponíveis — sem cartão flutuante, para se integrar ao painel.
 */
export function SectionVariantPicker({ control }: SectionVariantPickerProps) {
  const { label, options, value, onChange } = control;
  const total = options.length;
  const idx = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );
  const current = options[idx];

  function go(nextIdx: number) {
    onChange(options[(nextIdx + total) % total].id);
  }

  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Layout</p>
        {current ? (
          <p className="truncate text-xs text-muted-foreground">
            {current.label}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label="Variante anterior"
          onClick={() => go(idx - 1)}
          disabled={total <= 1}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <div
          role="tablist"
          aria-label={`Variação de ${label}`}
          className="flex items-center gap-1 px-1"
        >
          {options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={opt.label}
              onClick={() => onChange(opt.id)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === idx
                  ? "w-5 bg-primary"
                  : "w-1.5 bg-muted-foreground/25 hover:bg-muted-foreground/50",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Próxima variante"
          onClick={() => go(idx + 1)}
          disabled={total <= 1}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
