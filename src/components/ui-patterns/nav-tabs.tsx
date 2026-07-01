import Link from "next/link";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface NavTabItem {
  label: string;
  href: string;
  active?: boolean;
  className?: string;
}

function NavTabs({
  items,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  items: NavTabItem[];
}) {
  return (
    <div
      data-slot="nav-tabs"
      className={cn(
        "flex items-center gap-7 border-b border-border overflow-x-auto bg-background relative",
        className,
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          data-active={item.active || undefined}
          className={cn(
            "text-sm whitespace-nowrap py-2.5 border-b-3 border-transparent transition-colors",
            "text-muted-foreground hover:text-primary",
            "data-[active]:text-primary data-[active]:border-b-3 data-[active]:border-primary",
            item.className,
          )}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export { NavTabs };
