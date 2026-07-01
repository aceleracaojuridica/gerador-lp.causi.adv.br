import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-[color,box-shadow,background,border] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted dark:bg-input/30",
        "hover:border-muted-foreground/35",
        "focus-visible:border-primary/50",
        "aria-invalid:border-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
