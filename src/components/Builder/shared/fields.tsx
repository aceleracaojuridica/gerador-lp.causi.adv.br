"use client";

import type { ReactNode } from "react";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  Field as UiField,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

export { maskPhone } from "@/lib/landing-pages/phone";

export const inputCls = cn(
  "flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

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
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <FieldLabel>
          {label}
          {required ? (
            <span className="ml-0.5 text-muted-foreground">*</span>
          ) : null}
        </FieldLabel>
        {labelAction ?? null}
      </div>
      <div
        className={cn(
          error &&
            "[&_input]:border-destructive/50 [&_textarea]:border-destructive/50",
        )}
      >
        {children}
      </div>
      {error ? (
        <FieldError errors={[{ message: error }]} />
      ) : hint ? (
        <FieldDescription>{hint}</FieldDescription>
      ) : null}
    </UiField>
  );
}
