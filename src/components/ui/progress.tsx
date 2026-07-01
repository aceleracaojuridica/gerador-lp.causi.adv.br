"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      {/* <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      /> */}
      <ProgressPrimitive.Indicator
        className="h-full transition-all duration-300"
        style={{
          width: `${value || 0}%`,
          background:
            "linear-gradient(to right, var(--primary), var(--primary-hover))",
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
