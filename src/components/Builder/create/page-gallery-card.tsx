import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageGalleryCardProps = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  url?: string;
  description?: string;
  badge?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  asButton?: boolean;
  footer?: ReactNode;
  className?: string;
};

const baseClass =
  "app-ui flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-shadow";

export function PageGalleryCard({
  imageSrc,
  imageAlt,
  title,
  url,
  description,
  badge,
  selected,
  onClick,
  asButton,
  footer,
  className,
}: PageGalleryCardProps) {
  const stateClass = selected
    ? "border-primary ring-2 ring-primary"
    : "hover:border-border hover:shadow-md";

  const inner = (
    <>
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover object-top"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {badge ? <div className="absolute top-2 right-2">{badge}</div> : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {url ? (
          <p className="mt-1 truncate font-mono text-xs font-medium text-primary">
            {url}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </>
  );

  const cls = cn(baseClass, stateClass, className);

  if (asButton) {
    return (
      <button type="button" onClick={onClick} className={cn(cls, "text-left")}>
        {inner}
      </button>
    );
  }

  return <div className={cls}>{inner}</div>;
}

export const GALLERY_CARD_CLASS = "w-full min-w-[240px] sm:min-w-0";
