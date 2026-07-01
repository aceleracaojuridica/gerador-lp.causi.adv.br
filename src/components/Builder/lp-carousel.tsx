"use client";

import type { LpListItem } from "@/lib/landing-pages/lp-store";
import { GalleryCarousel } from "./gallery-carousel";
import { LpCard } from "./lp-card";

export function LpCarousel({ lps }: { lps: LpListItem[] }) {
  return (
    <GalleryCarousel
      items={lps.map((lp) => ({
        id: lp.slug,
        content: (
          <LpCard
            slug={lp.slug}
            name={lp.name}
            status={lp.status}
            preview={lp.preview}
          />
        ),
      }))}
    />
  );
}
