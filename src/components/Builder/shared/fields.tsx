"use client";

import { KeyboardArrowDown } from "@material-symbols-svg/react";
import type { ReactNode } from "react";
import {
  FieldError,
  FieldLabel,
  Field as UiField,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

export { maskPhone } from "@/lib/landing-pages/phone";

export const inputCls = cn(
  "flex w-full rounded-[5px] border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

/**
 * Select do builder: mesmo visual do input (radius 5px), sem a seta nativa
 * (que fica desalinhada), com um chevron próprio alinhado à direita.
 */
export function BuilderSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        className={cn(
          inputCls,
          "cursor-pointer appearance-none pr-9",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <KeyboardArrowDown
        size={18}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

/** Campo do builder — composição sobre `@/components/ui/field`. */
export function BuilderField({
  label,
  children,
  hint,
  required,
  error,
  labelAction,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
  error?: string;
  labelAction?: ReactNode;
  className?: string;
}) {
  return (
    <UiField data-invalid={!!error} className={className}>
      {/* Label + descrição agrupados num bloco só: o `gap-2` do Field separa
          grupo ↔ input, e a dica fica colada ao label (não flutuando). */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>
            {label}
            {required ? (
              <span className="ml-0.5 text-muted-foreground">*</span>
            ) : null}
          </FieldLabel>
          {labelAction ?? null}
        </div>
        {hint ? (
          <p className="mt-1 text-xs leading-normal text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          error &&
            "[&_input]:border-destructive/50 [&_textarea]:border-destructive/50",
        )}
      >
        {children}
      </div>
      {error ? <FieldError errors={[{ message: error }]} /> : null}
    </UiField>
  );
}
