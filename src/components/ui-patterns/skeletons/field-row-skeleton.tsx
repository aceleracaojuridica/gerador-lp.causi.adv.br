import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type FieldRowSkeletonProps = {
  borderless?: boolean;
  inputHeight?: string;
};

export function FieldRowSkeleton({
  borderless = false,
  inputHeight = "h-10",
}: FieldRowSkeletonProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-6",
        !borderless && "border-b border-border pb-5",
      )}
    >
      <div className="space-y-1.5 sm:pt-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-48 max-w-full" />
      </div>
      <Skeleton className={cn("w-full rounded-md", inputHeight)} />
    </div>
  );
}
