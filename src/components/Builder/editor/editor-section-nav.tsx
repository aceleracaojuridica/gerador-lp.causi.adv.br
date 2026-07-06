"use client";

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
 * Lista vertical de seções no painel de detalhe — navegação previsível sem
 * carrossel horizontal ou setas que escondem o contexto.
 */
export function EditorSectionNav({
  sections,
  current,
  onChange,
  className,
}: Props) {
  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Seções da landing page"
      className={cn(
        "flex min-h-0 shrink-0 flex-col overflow-hidden border-b border-border bg-muted/30 lg:w-44 lg:overflow-y-auto lg:border-b-0 lg:border-r",
        className,
      )}
    >
      <p className="hidden px-3 pb-2 pt-3 text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground lg:block">
        Seções
      </p>
      <ul className="flex max-h-32 flex-col gap-0.5 overflow-y-auto border-b border-border px-2 py-2 lg:max-h-none lg:border-b-0 lg:px-2 lg:pb-3">
        {sections.map((section) => {
          const active = section.id === current;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "w-full rounded-lg px-2.5 py-2 text-left transition lg:px-3",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span className="block truncate text-xs font-semibold lg:text-sm">
                  {section.label}
                </span>
                {section.variantLabel ? (
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[0.65rem] lg:text-xs",
                      active ? "text-primary/80" : "text-muted-foreground",
                    )}
                  >
                    {section.variantLabel}
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
