import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getLpAdminEnv } from "@/lib/env";

/** Cliente admin do banco de LPs (Projeto B). Nunca expor ao browser. */
export function lpAdmin() {
  const { url, key } = getLpAdminEnv();
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
