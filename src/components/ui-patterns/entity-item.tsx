"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

type EntityItemTriggerSize = "default" | "sm" | "lg";

const EntityItemTriggerSizeContext =
  React.createContext<EntityItemTriggerSize>("default");

function EntityItemTriggerSizeProvider({
  size,
  children,
}: {
  size: EntityItemTriggerSize;
  children: React.ReactNode;
}) {
  return (
    <EntityItemTriggerSizeContext.Provider value={size}>
      {children}
    </EntityItemTriggerSizeContext.Provider>
  );
}

function EntityItem({
  className,
  ...props
}: React.ComponentProps<typeof Item>) {
  return (
    <Item
      size="xs"
      className={cn("flex-1 flex-nowrap items-center p-0 min-w-0", className)}
      {...props}
    />
  );
}

function EntityItemAddonStart({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="entity-item-addon-start"
      className={cn("flex shrink-0 items-center", className)}
      {...props}
    />
  );
}

function EntityItemAddonEnd({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="entity-item-addon-end"
      className={cn("shrink-0 ml-auto", className)}
      {...props}
    />
  );
}

function EntityItemAvatar({
  src,
  alt,
  fallback,
  variant = "list",
  className,
}: {
  src?: string;
  alt?: string;
  fallback?: string;
  variant?: "list" | "trigger";
  className?: string;
}) {
  const triggerSize = React.use(EntityItemTriggerSizeContext);
  const avatarKey = src?.trim() ? `src:${src}` : `fallback:${fallback ?? ""}`;

  return (
    <Avatar
      key={avatarKey}
      className={cn(
        variant === "list" && "mt-px size-8",
        variant === "trigger" &&
          cn("size-7", triggerSize === "sm" && "size-6.5"),
        className,
      )}
    >
      {src ? <AvatarImage src={src} alt={alt ?? fallback ?? ""} /> : null}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

function EntityItemTitle({
  className,
  ...props
}: React.ComponentProps<typeof ItemTitle>) {
  return (
    <ItemTitle
      className={cn(
        "line-clamp-1 break-all max-w-full only:font-normal",
        className,
      )}
      {...props}
    />
  );
}

function EntityItemDescription({
  className,
  ...props
}: React.ComponentProps<typeof ItemDescription>) {
  return <ItemDescription className={cn("text-xs", className)} {...props} />;
}

function EntityItemTextGroup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <ItemContent className={cn("gap-0 min-w-0", className)}>
      {children}
    </ItemContent>
  );
}

export {
  EntityItem,
  EntityItemAddonEnd,
  EntityItemAddonStart,
  EntityItemAvatar,
  EntityItemDescription,
  EntityItemTextGroup,
  EntityItemTitle,
  EntityItemTriggerSizeProvider,
};
