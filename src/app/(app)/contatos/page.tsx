import { AccessDenied } from "@/components/ui/access-denied";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { ContatosPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const session = await requireAuth();
  if (!hasLpAccess(session)) return <AccessDenied />;
  return <ContatosPageClient />;
}
