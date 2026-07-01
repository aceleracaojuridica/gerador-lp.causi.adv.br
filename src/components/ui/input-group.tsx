"use client";

import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "group/input-group relative flex w-full items-center rounded-md border border-input hover:border-muted-foreground/35 transition-[color,box-shadow,border] outline-none dark:bg-input/30 data-disabled:bg-muted data-disabled:pointer-events-none dark:data-disabled:bg-input/0",
        "h-10 min-w-0 has-[>textarea]:h-auto",

        // Variants based on alignment.
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",

        // Focus state.
        "has-[[data-slot=input-group-control]:focus-visible]:border-primary/50",

        // Error state.
        "has-[[data-slot][aria-invalid=true]]:border-destructive/50",

        className,
      )}
      {...props}
    />
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
        "inline-end":
          "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
        "block-start":
          "order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
        "block-end":
          "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
      },
    },
    defaultVariants: {
      align: "inline-start",
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: This is a visual wrapper that forwards focus to the input, not a button itself.
    <div
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align }), className)}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.parentElement?.querySelector("input")?.focus();
        }
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva(
  "flex items-center gap-2 text-sm shadow-none",
  {
    variants: {
      size: {
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
        "icon-xs":
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm":
          "size-8 p-0 has-[>svg]:p-0 [&_svg:not([class*='size-'])]:size-4",
        "icon-md":
          "size-9 p-0 has-[>svg]:p-0 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      size: "xs",
    },
  },
);

type InputGroupButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "size"
> &
  VariantProps<typeof inputGroupButtonVariants>;

type InputGroupButtonSize = NonNullable<
  VariantProps<typeof inputGroupButtonVariants>["size"]
>;

const inputGroupButtonSizeMap = {
  xs: "xs",
  sm: "sm",
  "icon-xs": "icon-xs",
  "icon-sm": "icon-sm",
  "icon-md": "icon",
} as const satisfies Record<
  InputGroupButtonSize,
  NonNullable<VariantProps<typeof buttonVariants>["size"]>
>;

const InputGroupButton = React.forwardRef<
  React.ElementRef<"button">,
  InputGroupButtonProps
>(function InputGroupButton(
  { className, type = "button", variant = "ghost", size = "xs", ...props },
  ref,
) {
  return (
    <Button
      ref={ref}
      type={type}
      data-size={size}
      variant={variant}
      size={inputGroupButtonSizeMap[size ?? "xs"]}
      className={cn(inputGroupButtonVariants({ size }), className)}
      {...props}
    />
  );
});

InputGroupButton.displayName = "InputGroupButton";

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <Input
      data-slot="input-group-control"
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent! shadow-none focus-visible:ring-0 dark:bg-transparent!",
        className,
      )}
      {...props}
    />
  );
}

function InputGroupTextarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <Textarea
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
