import { notFound } from "next/navigation";
import { AccessDenied } from "@/components/ui/access-denied";
import { canEditLp } from "@/lib/landing-pages/permissions";
import { getLp, getLpMeta } from "@/lib/landing-pages/lp-store";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { LpEditorPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireAuth();
  if (!hasLpAccess(session)) return <AccessDenied />;
  const { slug } = await params;
  const sp = await searchParams;
  const meta = await getLpMeta(session, slug);
  if (!meta) notFound();
  if (!canEditLp(session, meta.createdByUserId)) {
    return (
      <AccessDenied description="Você só pode editar landing pages que você criou." />
    );
  }

  const lp = await getLp(session, slug);
  if (!lp) notFound();

  return <LpEditorPageClient initial={lp} startTour={sp?.novo === "1"} />;
}
