"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: "Não foi possível desconectar" };
  }

  (await cookies()).delete("causi_act");

  return { success: true };
}
