"use client";

import type { ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

/** Cards na galeria do estúdio e no wizard (largura total). */
export const GALLERY_CAROUSEL_ITEM_CLASS =
  "basis-full sm:basis-1/2 lg:basis-1/3";

/** Cards no painel estreito do editor (~480px). */
export const COMPACT_CAROUSEL_ITEM_CLASS = "basis-[88%] sm:basis-[220px]";

type GalleryCarouselProps = {
  items: { id: string; content: ReactNode }[];
  itemClassName?: string;
  className?: string;
};

export function GalleryCarousel({
  items,
  itemClassName = GALLERY_CAROUSEL_ITEM_CLASS,
  className = "px-10 sm:px-12",
}: GalleryCarouselProps) {
  return (
    <Carousel opts={{ align: "start", dragFree: true }} className={className}>
      <CarouselContent>
        {items.map(({ id, content }) => (
          <CarouselItem key={id} className={itemClassName}>
            {content}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="hidden sm:inline-flex" />
      <CarouselNext className="hidden sm:inline-flex" />
    </Carousel>
  );
}
