"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingOverlayProps {
  className?: string;
}

export function LoadingOverlay({ className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-card/90",
        className,
      )}
    >
      <Spinner variant="primary" size="xl" />
    </div>
  );
}
