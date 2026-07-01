import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border px-2 py-1.5 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-1.5 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "bg-destructive/10 text-destructive-foreground border-destructive/15 *:data-[slot=alert-description]:text-destructive-foreground [&>svg]:text-destructive",
        warning:
          "bg-warning/10 text-warning-foreground border-warning/15 *:data-[slot=alert-description]:text-warning-foreground [&>svg]:text-warning",
        success:
          "bg-success/10 text-success-foreground border-success/15 *:data-[slot=alert-description]:text-success-foreground [&>svg]:text-success",
        info: "bg-info/10 text-info-foreground border-info/15 *:data-[slot=alert-description]:text-info-foreground [&>svg]:text-info",
        muted:
          "bg-muted/10 text-muted-foreground border-muted/15 *:data-[slot=alert-description]:text-muted-foreground [&>svg]:text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-xs [&_p]:leading-relaxed mt-0.5",
        className,
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
