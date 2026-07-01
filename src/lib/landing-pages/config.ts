/*
  Configuração GLOBAL por usuário, escopada por `causi_user_id`. Vale para
  todas as LPs dele: tipografia, tags de conversão e domínio.

  Persistida no banco do Projeto B (gerador de LPs) na tabela
  `public.user_settings`, via service_role (lpAdmin). Server-only.
*/
import "server-only";
import { getSession } from "@/lib/session";
import { lpAdmin } from "@/lib/supabase/admin";

export type GlobalConfig = {
  fonts: { heading: string; body: string };
  tags: { head: string; body: string; footer: string };
  domain: string;
};

export const DEFAULT_CONFIG: GlobalConfig = {
  fonts: { heading: "", body: "" },
  tags: { head: "", body: "", footer: "" },
  domain: "",
};

/** Linha de `user_settings` (Projeto B). */
type UserSettingsRow = {
  heading_font: string | null;
  body_font: string | null;
  tracking_tags: Partial<GlobalConfig["tags"]> | null;
  custom_domain: string | null;
};

export async function getConfig(): Promise<GlobalConfig> {
  const session = await getSession();
  if (!session) return { ...DEFAULT_CONFIG };

  const { data } = await lpAdmin()
    .from("user_settings")
    .select("heading_font,body_font,tracking_tags,custom_domain")
    .eq("causi_user_id", session.user.id)
    .maybeSingle<UserSettingsRow>();

  if (!data) return { ...DEFAULT_CONFIG };
  return {
    fonts: {
      heading: data.heading_font ?? "",
      body: data.body_font ?? "",
    },
    tags: { ...DEFAULT_CONFIG.tags, ...(data.tracking_tags ?? {}) },
    domain: data.custom_domain ?? "",
  };
}

export async function saveConfig(c: GlobalConfig): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");

  const { error } = await lpAdmin().from("user_settings").upsert(
    {
      causi_user_id: session.user.id,
      heading_font: c.fonts.heading,
      body_font: c.fonts.body,
      tracking_tags: c.tags,
      custom_domain: c.domain,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "causi_user_id" },
  );
  if (error) throw new Error(error.message);
}
