import { requireAuth } from "@/lib/session";
import { GalleryPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  await requireAuth();
  return <GalleryPageClient />;
}
