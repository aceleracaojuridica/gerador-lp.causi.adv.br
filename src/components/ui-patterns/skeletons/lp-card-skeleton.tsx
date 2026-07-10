import { Skeleton } from "@/components/ui/skeleton";

export function LpCardSkeleton() {
  return (
    <div className="group relative w-full shrink-0 sm:w-[300px]">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-3 flex items-start gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full sm:size-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4 sm:h-6" />
            <Skeleton className="h-3.5 w-1/2 sm:h-4" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-3.5 w-full max-w-[120px]" />
          </div>
          <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
            <Skeleton className="h-3.5 w-14" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <Skeleton className="absolute top-3 right-3 size-8 rounded-md" />
    </div>
  );
}
