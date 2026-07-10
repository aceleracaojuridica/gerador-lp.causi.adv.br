import { Skeleton } from "@/components/ui/skeleton";
import { FormCardSkeleton } from "./form-card-skeleton";

const SETTINGS_NAV_KEYS = [
  "nav-visual",
  "nav-tracking",
  "nav-pixels",
  "nav-scripts",
  "nav-captcha",
] as const;

export function SettingsFormSkeleton() {
  return (
    <div className="flex h-full w-full max-w-full flex-1 flex-col overflow-hidden md:flex-row">
      <aside className="hidden shrink-0 overflow-y-auto border-r border-border bg-card md:block md:w-80 lg:w-90">
        <div className="border-b border-border px-4 py-4 md:px-6 md:pt-6 md:pb-6">
          <Skeleton className="h-7 w-36 md:h-8" />
          <Skeleton className="mt-2 h-4 w-56 max-w-full" />
        </div>
        <div className="space-y-1 px-4 py-2 md:px-6 md:pb-6">
          {SETTINGS_NAV_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5"
            >
              <Skeleton className="size-5 shrink-0 rounded-sm" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full max-w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="relative flex min-h-0 flex-1 flex-col pb-20 md:pb-0">
        <header className="sticky top-0 z-10 hidden shrink-0 border-b border-border bg-background md:block">
          <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-0 md:py-6">
            <Skeleton className="h-7 w-40 md:h-8" />
            <Skeleton className="mt-2 h-4 w-72 max-w-full" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl space-y-6 px-6 pt-6 md:px-0 md:pt-8">
            <FormCardSkeleton rowCount={3} />
            <FormCardSkeleton rowCount={2} />
          </div>
        </div>
      </div>
    </div>
  );
}
