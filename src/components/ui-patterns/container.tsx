import type * as React from "react";

import { cn } from "@/lib/utils";

type Orientation = "vertical" | "horizontal";
type OverflowMode = "auto" | "hidden";

interface ContainerProps extends React.ComponentProps<"div"> {
  orientation?: Orientation;
  overflow?: OverflowMode;
  stretch?: boolean;
}

function Container({
  className,
  orientation = "vertical",
  overflow = "auto",
  stretch = true,
  ...props
}: ContainerProps) {
  return (
    <div
      data-slot="container"
      className={cn(
        "flex bg-background relative",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        overflow === "hidden" ? "overflow-hidden" : "overflow-auto",
        stretch && "h-full w-full",
        className,
      )}
      {...props}
    />
  );
}

interface ContainerSectionProps extends React.ComponentProps<"div"> {
  grow?: boolean;
  maxWidth?: string;
  overflow?: OverflowMode;
  orientation?: Orientation;
}

function ContainerSection({
  className,
  grow = false,
  maxWidth,
  overflow = "auto",
  orientation = "vertical",
  ...props
}: ContainerSectionProps) {
  return (
    <div
      data-slot="container-section"
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row" : "flex-col",
        overflow === "hidden" ? "overflow-hidden" : "overflow-auto",
        grow && "flex-1",
        maxWidth,
        className,
      )}
      {...props}
    />
  );
}

export { Container, ContainerSection };
