import { requireAuth } from "@/lib/session";
import { ContatosPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function ContatosPage() {
  const session = await requireAuth();
  return <ContatosPageClient key={session.account.id} />;
}
