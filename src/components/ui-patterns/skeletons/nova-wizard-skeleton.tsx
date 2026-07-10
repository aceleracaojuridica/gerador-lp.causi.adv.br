import { Skeleton } from "@/components/ui/skeleton";
import { FieldRowSkeleton } from "./field-row-skeleton";

const STEP_KEYS = ["step-office", "step-contact", "step-images"] as const;
const FIELD_KEYS = [
  "field-a",
  "field-b",
  "field-c",
  "field-d",
  "field-e",
] as const;

export function NovaWizardSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-card">
      <header className="flex shrink-0 border-b border-border">
        <div className="hidden shrink-0 border-r border-border px-[30px] py-5 md:block md:w-96">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="flex-1 py-4 md:py-5">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-8 w-36" />
              <Skeleton className="h-4 w-56 max-w-full" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="hidden shrink-0 flex-col justify-between overflow-y-auto border-r border-border px-[30px] py-4 md:flex md:w-96">
          <nav className="space-y-1" aria-hidden>
            {STEP_KEYS.map((key) => (
              <div
                key={key}
                className="flex w-full items-start gap-3 rounded-md p-2 md:p-3"
              >
                <Skeleton className="size-9 shrink-0 rounded-sm" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3.5 w-full max-w-[180px]" />
                </div>
              </div>
            ))}
          </nav>
          <div className="mt-4 space-y-1.5 px-1">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-3xl space-y-0">
              {FIELD_KEYS.map((key, index) => (
                <FieldRowSkeleton
                  key={key}
                  borderless={index === FIELD_KEYS.length - 1}
                  inputHeight={index === 1 ? "h-24" : "h-10"}
                />
              ))}
            </div>
          </div>
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-4 sm:px-6">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </footer>
        </div>
      </div>
    </div>
  );
}
