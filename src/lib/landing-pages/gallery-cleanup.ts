import "server-only";

import type { Session } from "@/lib/session/types";
import {
  createLpUserClient,
  sessionToLpContext,
} from "@/lib/supabase/lp-client";
import { GERADOR_LP_BUCKET } from "./media-storage";

function throwDbError(error: { message: string; code?: string }): never {
  throw Object.assign(new Error(error.message), { code: error.code });
}

/** Remove todas as imagens órfãs (sem usos) da galeria da conta. */
export async function deleteOrphanedImages(session: Session): Promise<void> {
  const ctx = sessionToLpContext(session);
  const db = createLpUserClient(session);

  const { data: allImages, error: fetchError } = await db
    .from("lp_account_images")
    .select(`
      id,
      storage_path,
      lp_image_usages (
        id
      )
    `)
    .eq("account_id", ctx.accountId);

  if (fetchError) throwDbError(fetchError);
  if (!allImages) return;

  const orphaned = allImages.filter(
    (img) => !img.lp_image_usages || img.lp_image_usages.length === 0,
  );
  if (orphaned.length === 0) return;

  const ids = orphaned.map((img) => img.id as string);
  const paths = orphaned.map((img) => img.storage_path as string);

  const { error: deleteRowError } = await db
    .from("lp_account_images")
    .delete()
    .in("id", ids);
  if (deleteRowError) throwDbError(deleteRowError);

  await db.storage.from(GERADOR_LP_BUCKET).remove(paths);
}
