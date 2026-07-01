import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm whitespace-nowrap transition-colors outline-none font-normal disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-background-primary text-primary-foreground hover:bg-background-primary/85",
        destructive:
          "bg-destructive text-white hover:bg-destructive/80 focus-visible:ring-destructive/20 dark:bg-destructive/80 dark:hover:bg-destructive",
        "destructive-outline":
          "border border-destructive/30 bg-background text-destructive hover:bg-destructive/10 dark:bg-destructive/15 dark:hover:bg-destructive/20",
        outline:
          "border border-border-interactive bg-background text-muted-foreground hover:bg-accent dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        "outline-light":
          "border border-border bg-background text-muted-foreground hover:bg-accent dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        input:
          "border text-foreground border-input bg-background hover:border-muted-foreground/35 dark:bg-input/30 disabled:opacity-100 disabled:bg-muted dark:disabled:bg-input/0",
        "input-button":
          "border text-muted-foreground border-input bg-background hover:border-muted-foreground/35 dark:bg-input/30",
        "input-addon":
          "text-muted-foreground-light hover:text-muted-foreground",
        "input-addon-active": "text-primary",
        secondary:
          "border border-primary/30 bg-background text-primary hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15",
        ghost:
          "text-muted-foreground aria-expanded:bg-accent hover:bg-accent dark:hover:bg-accent",
        "ghost-active":
          "bg-primary/10 dark:bg-primary/15 text-primary hover:bg-primary/15 dark:hover:bg-primary/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-7 gap-1 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        sm: "h-8 gap-1.5 rounded-md px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-9 md:h-10 rounded-md px-4 md:px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xxs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-4",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-9 md:size-10",
        "icon-xl": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<React.ElementRef<"button">, ButtonProps>(
  function Button(
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot.Root : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
