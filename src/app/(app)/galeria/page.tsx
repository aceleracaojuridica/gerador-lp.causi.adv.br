import { AccessDenied } from "@/components/ui/access-denied";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { GalleryPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const session = await requireAuth();
  if (!hasLpAccess(session)) return <AccessDenied />;
  return <GalleryPageClient />;
}
