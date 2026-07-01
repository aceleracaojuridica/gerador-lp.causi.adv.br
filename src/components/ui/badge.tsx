import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 font-normal overflow-hidden rounded border border-transparent whitespace-nowrap transition-[color,box-shadow,background] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-background-primary text-primary-foreground [button&]:hover:bg-background-primary/90",
        muted:
          "bg-muted-foreground/10 dark:bg-muted-foreground/15 text-muted-foreground [button&]:hover:bg-muted-foreground/15 [button&]:dark:hover:bg-muted-foreground/20",
        secondary:
          "bg-primary/10 dark:bg-primary/15 text-primary [button&]:hover:bg-primary/15",
        destructive:
          "bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [button&]:hover:bg-destructive/90",
        outline:
          "border-border text-foreground [button&]:hover:bg-accent [button&]:hover:text-accent-foreground",
        ghost:
          "[button&]:hover:bg-accent [button&]:hover:text-accent-foreground",
        link: "text-primary underline-offset-4 [button&]:hover:underline",
      },
      size: {
        default: "px-1.5 py-0.5 min-w-[22px] text-xs",
        xs: "px-1.5 py-0.5 min-w-[20px] text-[11px]",
        sm: "px-1.5 py-0.5 min-w-[26px] text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-size={size}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
