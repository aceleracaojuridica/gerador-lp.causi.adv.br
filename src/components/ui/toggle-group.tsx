"use client";

import type { VariantProps } from "class-variance-authority";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import * as React from "react";
import { toggleVariants } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
    stretch?: boolean;
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
  stretch: false,
});

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  children,
  orientation = "horizontal",
  stretch = false,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    stretch?: boolean;
  }) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        spacing > 0 ? "border border-input p-[--spacing(var(--gap))]" : "",
        "group/toggle-group flex w-fit items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=default]:data-[variant=outline]:shadow-xs data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider
        value={{ variant, size, spacing, orientation, stretch }}
      >
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      data-orientation={context.orientation}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        context.stretch
          ? context.orientation === "vertical"
            ? "w-full min-w-0 shrink-0 justify-start focus:z-10 focus-visible:z-10"
            : "flex-1 min-w-0 shrink-0 focus:z-10 focus-visible:z-10"
          : "w-auto min-w-0 shrink-0 focus:z-10 focus-visible:z-10",
        "data-[spacing=0]:data-[orientation=horizontal]:rounded-none data-[spacing=0]:data-[orientation=horizontal]:shadow-none data-[spacing=0]:data-[orientation=horizontal]:first:rounded-l-md data-[spacing=0]:data-[orientation=horizontal]:last:rounded-r-md data-[spacing=0]:data-[orientation=horizontal]:data-[variant=outline]:border-l-0 data-[spacing=0]:data-[orientation=horizontal]:data-[variant=outline]:first:border-l",
        "data-[spacing=0]:data-[orientation=vertical]:rounded-none data-[spacing=0]:data-[orientation=vertical]:shadow-none data-[spacing=0]:data-[orientation=vertical]:first:rounded-t-md data-[spacing=0]:data-[orientation=vertical]:last:rounded-b-md data-[spacing=0]:data-[orientation=vertical]:data-[variant=outline]:border-t-0 data-[spacing=0]:data-[orientation=vertical]:data-[variant=outline]:first:border-t",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}

export { ToggleGroup, ToggleGroupItem };
