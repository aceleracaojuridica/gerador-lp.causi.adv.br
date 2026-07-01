import type { ReactNode } from "react";
import type { LpListPreview } from "@/lib/landing-pages/lp-preview";
import { LinkSharePreview } from "./link-share-preview";

type LpLinkPreviewCardProps = {
  preview: LpListPreview;
  badge?: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** Card da galeria: prévia de link (OG) com conteúdo real da LP. */
export function LpLinkPreviewCard({
  preview,
  badge,
  footer,
  className = "",
}: LpLinkPreviewCardProps) {
  return (
    <div
      className={`flex border border-border w-full flex-col overflow-hidden rounded-2xl bg-white transition  ${className}`}
    >
      <LinkSharePreview
        title={preview.title}
        description={preview.description}
        image={preview.image}
        siteName={preview.siteName}
        host={preview.host}
        badge={badge}
        footer={footer}
      />
    </div>
  );
}

/** Largura dos cards na galeria de LPs. */
export const LP_GALLERY_CARD_CLASS = "w-full min-w-[240px] sm:min-w-0";
