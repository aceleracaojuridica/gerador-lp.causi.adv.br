export type GalleryImageFilter = "all" | "system" | "account" | "mine";

export const GALLERY_IMAGE_FILTER_OPTIONS: {
  value: GalleryImageFilter;
  label: string;
}[] = [
  { value: "all", label: "Todas" },
  { value: "account", label: "Conta" },
  { value: "mine", label: "Minhas" },
  { value: "system", label: "Sistema" },
];

type FilterableGalleryImage = {
  source: "account" | "system";
  uploadedByUserId: string;
};

/** Filtra imagens da galeria por origem ou por uploader (minhas). */
export function filterGalleryImages<T extends FilterableGalleryImage>(
  images: T[],
  filter: GalleryImageFilter,
  currentUserId?: string,
): T[] {
  switch (filter) {
    case "system":
      return images.filter((img) => img.source === "system");
    case "account":
      return images.filter((img) => img.source === "account");
    case "mine":
      if (!currentUserId) return [];
      return images.filter(
        (img) =>
          img.source === "account" && img.uploadedByUserId === currentUserId,
      );
    default:
      return images;
  }
}
