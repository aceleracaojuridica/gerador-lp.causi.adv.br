import { listLps } from "@/lib/landing-pages/lp-store";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { HomePageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAuth();
  const lps = hasLpAccess(session) ? await listLps(session.user.id) : [];

  return <HomePageClient lps={lps} />;
}
