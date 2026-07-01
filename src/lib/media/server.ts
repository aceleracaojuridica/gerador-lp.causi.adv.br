import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  MediaAsset,
  MediaBucket,
  MediaCleanupResult,
  MediaMetadata,
} from "./types";
import { extractMediaPath, resolveMediaPublicUrl } from "./urls";

type UploadMediaObjectOptions = {
  bucket?: MediaBucket;
  file: File;
  path: string;
  metadata?: MediaMetadata;
  cacheControl?: string;
  upsert?: boolean;
};

/**
 * Faz upload autenticado no bucket especificado e retorna a referencia canonica do objeto.
 * Por padrão utiliza o bucket `media`.
 */
export async function uploadMediaObject({
  bucket = "media",
  file,
  path,
  metadata,
  cacheControl = "3600",
  upsert = false,
}: UploadMediaObjectOptions): Promise<MediaAsset> {
  const supabase = await createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl, upsert, metadata });

  if (error) {
    throw new Error(error.message);
  }

  return {
    bucket,
    path,
    publicUrl: resolveMediaPublicUrl(path) ?? path,
  };
}

/**
 * Tenta remover um objeto antigo do bucket `media` e sempre retorna um estado deterministico.
 */
export async function cleanupMediaObject(
  previousValue: string | null,
): Promise<MediaCleanupResult> {
  const previousPath = extractMediaPath(previousValue);

  if (!previousValue) {
    return { status: "not-requested", previousPath: null };
  }

  if (!previousPath) {
    return {
      status: "skipped",
      previousPath: null,
      message: "A referencia anterior nao pertence ao bucket media.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from("media").remove([previousPath]);

  if (!error) {
    return { status: "deleted", previousPath };
  }

  if (/not found/i.test(error.message)) {
    return {
      status: "not-found",
      previousPath,
      message: "O arquivo anterior ja nao existia no bucket.",
    };
  }

  return {
    status: "pending-manual-cleanup",
    previousPath,
    message: error.message,
  };
}
