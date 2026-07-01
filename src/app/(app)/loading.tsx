import { Skeleton } from "@/components/ui/skeleton";

function LpCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-white">
      {/* image area — same aspect ratio as LinkSharePreview */}
      <Skeleton className="aspect-[1.91/1] w-full rounded-none" />
      {/* meta block */}
      <div className="space-y-1.5 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      {/* action row */}
      <div className="flex gap-2 border-t border-slate-100 bg-white px-3 py-3">
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header skeleton — mirrors grid-cols-2 gap-4 p-4 md:p-7 */}
      <div className="grid grid-cols-2 items-center gap-4 border-b border-border bg-background p-4 md:p-7">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-3.5 w-72 max-w-full" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
      </div>

      {/* Carousel skeleton — 3 cards, respects sm:basis-1/2 lg:basis-1/3 */}
      <div className="flex-1 overflow-hidden px-4 py-6 md:px-7">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <LpCardSkeleton />
          <LpCardSkeleton />
          <LpCardSkeleton />
        </div>
      </div>
    </div>
  );
}
