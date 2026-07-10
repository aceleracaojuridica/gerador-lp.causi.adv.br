import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PageHeaderSkeletonProps = {
  titleWidth?: string;
  showBadge?: boolean;
  actionCount?: number;
  actions?: ReactNode;
  className?: string;
};

const ACTION_KEYS = ["action-a", "action-b", "action-c"] as const;

export function PageHeaderSkeleton({
  titleWidth = "w-44",
  showBadge = false,
  actionCount = 0,
  actions,
  className,
}: PageHeaderSkeletonProps) {
  return (
    <header
      className={cn(
        "grid shrink-0 grid-cols-2 items-center gap-4 border-b border-border bg-background p-4 md:p-7",
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Skeleton className={cn("h-7", titleWidth)} />
          {showBadge ? <Skeleton className="h-5 w-8 rounded-full" /> : null}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2.5">
        {actions ??
          ACTION_KEYS.slice(0, actionCount).map((key) => (
            <Skeleton
              key={key}
              className={cn(
                "rounded-lg",
                actionCount === 1 ? "h-10 w-40" : "h-10 w-28",
              )}
            />
          ))}
      </div>
    </header>
  );
}
