import type { SectionImageKey } from "./schema";

export type SeoImageKey = "ogImage" | "favicon";

export type MediaResource =
  | { kind: "logo" }
  | { kind: "lawyers"; id: string }
  | { kind: "sections"; key: SectionImageKey }
  | { kind: "seo"; key: SeoImageKey };
