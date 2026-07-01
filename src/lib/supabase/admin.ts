import "server-only";

import { createLpServiceClient } from "@/lib/supabase/lp-client";
import { getLpAdminEnv } from "@/lib/env";
import { createClient } from "@supabase/supabase-js";

/** Cliente admin do banco de LPs (Projeto B). Nunca expor ao browser. */
export function lpAdmin() {
  const { url, key } = getLpAdminEnv();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Alias para jobs de migração e leitura de profiles. */
export { createLpServiceClient };
