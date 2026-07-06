import type { ReactNode } from "react";
import {
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

const ROW_BASE =
  "grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-6";

export function FieldRow({
  label,
  description,
  children,
  borderless = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  borderless?: boolean;
}) {
  return (
    <FormItem
      className={cn(ROW_BASE, !borderless && "border-b border-border pb-5")}
    >
      <div className="space-y-1 sm:pt-2">
        <FormLabel>{label}</FormLabel>
        {description ? <FormDescription>{description}</FormDescription> : null}
      </div>
      <div className="space-y-2">
        {children}
        <FormMessage />
      </div>
    </FormItem>
  );
}
