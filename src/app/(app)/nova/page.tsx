import { requireLpAccessOrRedirect } from "@/lib/session";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { NovaPageClient } from "./page.client";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireLpAccessOrRedirect();

  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data: addresses } = await db
    .from("lp_account_addresses")
    .select("id, address, cidade, uf, maps_url, is_primary")
    .eq("account_id", ctx.accountId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const { data: contacts } = await db
    .from("lp_account_contacts")
    .select("id, whatsapp, whatsapp_display, email, is_primary")
    .eq("account_id", ctx.accountId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  const { data: socials } = await db
    .from("lp_account_socials")
    .select("id, network, url, is_primary")
    .eq("account_id", ctx.accountId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  return (
    <NovaPageClient
      key={session.account.id}
      defaultOfficeName={session.account.name}
      savedAddresses={addresses || []}
      savedContacts={contacts || []}
      savedSocials={socials || []}
    />
  );
}
