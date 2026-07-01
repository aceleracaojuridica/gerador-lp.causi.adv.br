import { cn } from "@/lib/utils";

function ColorDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn("size-2 shrink-0 rounded-xs", className)}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

export { ColorDot };
