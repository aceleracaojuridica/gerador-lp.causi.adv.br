import { listLps } from "@/lib/landing-pages/lp-store";
import { createClient } from "@/lib/supabase/server";
import { hasLpAccess, requireAuth } from "@/lib/session";
import { HomePageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requireAuth();
  const lps = hasLpAccess(session) ? await listLps(session) : [];

  const creatorIds = [...new Set(lps.map((lp) => lp.createdByUserId))];
  const nameById = new Map<string, string>();
  if (creatorIds.length > 0) {
    const causi = await createClient();
    const { data } = await causi
      .from("users")
      .select("id,name")
      .in("id", creatorIds);
    for (const row of data ?? []) {
      nameById.set(row.id as string, (row.name as string) || "Usuário");
    }
  }

  const lpsWithCreators = lps.map((lp) => ({
    ...lp,
    createdByLabel: nameById.get(lp.createdByUserId) ?? "Usuário",
    isOwnLp: lp.createdByUserId === session.user.id,
  }));

  return <HomePageClient lps={lpsWithCreators} />;
}
