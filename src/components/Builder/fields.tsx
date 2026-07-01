import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const inputCls = cn(
  "flex w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors",
  "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export function Field({
  label,
  children,
  hint,
  required,
  error,
  labelAction,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  error?: string;
  labelAction?: React.ReactNode;
}) {
  return (
    <div className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-sm font-semibold">
          {label}
          {required ? (
            <span className="ml-0.5 text-muted-foreground">*</span>
          ) : null}
        </Label>
        {labelAction ?? null}
      </div>
      <div
        className={
          error
            ? "[&_input]:border-destructive/50 [&_textarea]:border-destructive/50"
            : ""
        }
      >
        {children}
      </div>
      {error ? (
        <span className="mt-1.5 flex w-full items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            !
          </span>
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </div>
  );
}

export function maskPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
