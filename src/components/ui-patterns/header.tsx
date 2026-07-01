import type * as React from "react";

import { cn } from "@/lib/utils";

function Header({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="header"
      className={cn(
        "grid grid-cols-2 gap-4 p-4 md:p-7 items-center justify-between border-b border-border bg-background shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function HeaderContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-content"
      className={cn("flex flex-col gap-3", className)}
      {...props}
    />
  );
}

function HeaderHeading({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-heading"
      className={cn("flex items-center gap-2 md:gap-3", className)}
      {...props}
    />
  );
}

function HeaderDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="header-description"
      className={cn("-mt-2 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function HeaderComplementary({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-complementary"
      className={cn("flex gap-2 items-center", className)}
      {...props}
    />
  );
}

function HeaderActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="header-actions"
      className={cn(
        "flex justify-end items-center gap-2.5 shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderDescription,
  HeaderHeading,
  HeaderComplementary,
};
