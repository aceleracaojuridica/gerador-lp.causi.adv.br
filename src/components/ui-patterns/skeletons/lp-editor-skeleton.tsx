import { Skeleton } from "@/components/ui/skeleton";

const EDITOR_NAV_KEYS = [
  "nav-hero",
  "nav-dor",
  "nav-solucao",
  "nav-areas",
  "nav-faq",
  "nav-cta",
  "nav-seo",
  "nav-integracoes",
] as const;
const EDITOR_CMS_KEYS = ["cms-a", "cms-b", "cms-c", "cms-d"] as const;
const EDITOR_TAB_KEYS = ["tab-nav", "tab-preview", "tab-cms"] as const;

export function LpEditorSkeleton() {
  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full max-w-full min-w-0 flex-col overflow-hidden bg-muted/40">
      <div className="shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-5">
        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:items-center lg:gap-4">
          <div className="flex min-w-0 items-center gap-2 lg:col-span-3">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:col-span-6 lg:justify-center">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="hidden h-4 w-40 lg:block" />
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:justify-end">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
      </div>

      <div className="hidden min-h-0 flex-1 lg:flex">
        <div className="flex w-[22%] min-w-0 flex-col border-r border-border bg-background">
          <div className="space-y-2 border-b border-border px-3 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
          <div className="flex-1 space-y-1 overflow-hidden p-3">
            {EDITOR_NAV_KEYS.map((key) => (
              <Skeleton key={key} className="h-9 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col bg-muted/20 p-4">
          <Skeleton className="mx-auto h-full min-h-[320px] w-full max-w-4xl rounded-2xl" />
        </div>
        <div className="flex w-[26%] min-w-0 flex-col border-l border-border bg-background">
          <div className="border-b border-border px-4 py-3">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex-1 space-y-4 p-4">
            {EDITOR_CMS_KEYS.map((key) => (
              <div key={key} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="flex-1 p-3">
          <Skeleton className="h-full min-h-[280px] w-full rounded-2xl" />
        </div>
        <nav
          aria-hidden
          className="flex shrink-0 justify-around border-t border-border bg-background px-2 py-2"
        >
          {EDITOR_TAB_KEYS.map((key) => (
            <Skeleton key={key} className="h-10 w-20 rounded-md" />
          ))}
        </nav>
      </div>
    </div>
  );
}
