import { createClient } from "@/lib/supabase/client";
import { resolveMediaPublicUrl } from "./urls";

type UploadMediaClientOptions = {
  file: File;
  path: string;
  cacheControl?: string;
  upsert?: boolean;
};

/**
 * Upload client-side opcional para fluxos de UX imediata.
 *
 * @remarks
 * Este helper nao persiste nenhuma referencia de negocio. Qualquer fluxo que use
 * upload direto no browser ainda precisa de confirmacao server-side antes de
 * considerar a operacao concluida.
 */
export async function uploadMediaClient({
  file,
  path,
  cacheControl = "3600",
  upsert = false,
}: UploadMediaClientOptions) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("media")
    .upload(path, file, { cacheControl, upsert });

  if (error) {
    throw error;
  }

  return {
    ...data,
    path,
    publicUrl: resolveMediaPublicUrl(path),
  };
}
