"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  GALLERY_IMAGE_FILTER_OPTIONS,
  type GalleryImageFilter,
} from "@/lib/landing-pages/gallery-filters";
import { cn } from "@/lib/utils";

type GalleryImageFilterBarProps = {
  value: GalleryImageFilter;
  onValueChange: (value: GalleryImageFilter) => void;
  className?: string;
  size?: "xs" | "sm" | "default";
};

export function GalleryImageFilterBar({
  value,
  onValueChange,
  className,
  size = "xs",
}: GalleryImageFilterBarProps) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      spacing={0}
      size={size}
      className={cn("flex-wrap", className)}
      onValueChange={(next) => {
        if (next) onValueChange(next as GalleryImageFilter);
      }}
    >
      {GALLERY_IMAGE_FILTER_OPTIONS.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="px-2.5 text-xs sm:px-3"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
