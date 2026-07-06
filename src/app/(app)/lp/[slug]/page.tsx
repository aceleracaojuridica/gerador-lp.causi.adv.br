import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/ui/access-denied";
import { getConfig } from "@/lib/landing-pages/config";
import { getLp, getLpMeta } from "@/lib/landing-pages/lp-store";
import { canEditLp } from "@/lib/landing-pages/permissions";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { LpEditorPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireAuth();
  if (!hasLpAccess(session)) return <AccessDenied />;
  const { slug } = await params;
  const meta = await getLpMeta(session, slug);
  if (!meta) notFound();
  if (!canEditLp(session, meta.createdByUserId)) {
    return (
      <AccessDenied description="Você só pode editar landing pages que você criou." />
    );
  }

  const lp = await getLp(session, slug);
  if (!lp) notFound();

  const initialAccountConfig = await getConfig();

  return (
    <LpEditorPageClient
      initial={lp}
      initialAccountConfig={initialAccountConfig}
    />
  );
}
