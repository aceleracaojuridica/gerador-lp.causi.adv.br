"use client";

import { ChevronLeft, ChevronRight } from "@material-symbols-svg/react";
import { cn } from "@/lib/utils";

export type EditorSectionMeta = {
  id: string;
  label: string;
  /** ID do anchor no preview (`sec-hero`, etc.). */
  previewTarget: string;
  /** Rótulo da variante atual, quando aplicável. */
  variantLabel?: string;
};

type Props = {
  sections: EditorSectionMeta[];
  current: string;
  onChange: (id: string) => void;
  className?: string;
};

/**
 * Navegação rápida entre seções do editor: setas ← → para ciclar e pills
 * horizontais para saltar direto — mesmo padrão do layout-picker do wizard.
 */
export function EditorSectionNav({
  sections,
  current,
  onChange,
  className,
}: Props) {
  const idx = Math.max(
    0,
    sections.findIndex((s) => s.id === current),
  );
  const active = sections[idx] ?? sections[0];
  const total = sections.length;

  function step(delta: number) {
    const next = sections[(idx + delta + total) % total];
    if (next) onChange(next.id);
  }

  if (total === 0) return null;

  return (
    <div
      className={cn(
        "min-w-0 max-w-full shrink-0 overflow-hidden border-b border-border bg-card",
        className,
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2 px-4 py-2.5">
        <button
          type="button"
          aria-label="Seção anterior"
          onClick={() => step(-1)}
          disabled={total <= 1}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-sm font-semibold text-foreground">
            {active.label}
            {active.variantLabel ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                — {active.variantLabel}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">
            {idx + 1} de {total}
          </p>
        </div>
        <button
          type="button"
          aria-label="Próxima seção"
          onClick={() => step(1)}
          disabled={total <= 1}
          className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-40"
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <nav
        aria-label="Seções da landing page"
        className="flex min-w-0 gap-1 overflow-x-auto px-3 pb-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition",
              current === s.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
