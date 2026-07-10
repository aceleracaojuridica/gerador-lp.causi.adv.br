import type { GalleryLandingPageDto } from "@/app/actions/gallery";
import type { GaleriaFilterValues } from "@/lib/landing-pages/gallery-filters";

export type { GaleriaFilterValues };

export type GaleriaFilterFormProps = {
  id: string;
  values: GaleriaFilterValues;
  landingPages: GalleryLandingPageDto[];
  allLpsValue: string;
  onValuesChange: (values: GaleriaFilterValues) => void;
  onSubmit: (values: GaleriaFilterValues) => void;
};
