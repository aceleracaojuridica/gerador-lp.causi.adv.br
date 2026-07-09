import "server-only";

import { createClient } from "@/lib/supabase/server";

/** JWT do usuário autenticado no Causi — para chamar Edge Functions do Projeto A. */
export async function getCausiAccessToken(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}
