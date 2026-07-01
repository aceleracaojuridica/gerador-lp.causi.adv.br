import { cn } from "@/lib/utils";

export const PAGE_CONTENT_CLASS =
  "flex-1 overflow-y-auto p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-500";

export function PageContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(PAGE_CONTENT_CLASS, className)}>{children}</div>;
}
