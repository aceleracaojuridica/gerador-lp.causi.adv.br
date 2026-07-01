import { AccessDenied } from "@/components/ui/access-denied";
import { TEMPLATES } from "@/lib/landing-pages/templates";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { NovaPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const session = await requireAuth();
  if (!hasLpAccess(session)) return <AccessDenied />;
  const sp = await searchParams;
  const initialTemplateId =
    sp.template && TEMPLATES.some((t) => t.id === sp.template)
      ? sp.template
      : undefined;
  return <NovaPageClient initialTemplateId={initialTemplateId} />;
}
