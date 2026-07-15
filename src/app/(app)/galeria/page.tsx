import { requireAuth } from "@/lib/session";
import { GalleryPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const session = await requireAuth();
  return <GalleryPageClient key={session.account.id} />;
}
