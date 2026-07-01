import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse animation-duration-1000 rounded-md bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
