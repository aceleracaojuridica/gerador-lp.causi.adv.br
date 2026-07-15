"use server";

import { revalidatePath } from "next/cache";
import { ACCESS_DENIED_ERROR, LP_ERRORS, mapLpDbError } from "@/lib/errors";
import { revalidateLpPublicCache } from "@/lib/landing-pages/lp-public-cache";
import {
  deleteLp,
  deleteOrphanedAssets,
  getLpMeta,
  publishLp,
  resolveOfficeSubdomain,
  saveLp,
  unpublishLp,
} from "@/lib/landing-pages/lp-store";
import { canEditLp } from "@/lib/landing-pages/permissions";
import type { StoredLp } from "@/lib/landing-pages/schema";
import { requireLpSession } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return "Não autenticado.";
    if (err.message === "FORBIDDEN") return ACCESS_DENIED_ERROR;
    const mapped = mapLpDbError(err);
    if (mapped.description !== fallback) return mapped.description;
    return err.message;
  }
  return fallback;
}

async function assertCanEditLp(slug: string): Promise<void> {
  const session = await requireLpSession();
  const meta = await getLpMeta(session, slug);
  if (meta && !canEditLp(session, meta.createdByUserId)) {
    throw new Error(LP_ERRORS.EDIT_LP_OWN_ONLY);
  }
}

/** Invalida cache da rota pública quando a LP está (ou ficará) publicada. */
function revalidatePublishedPublic(
  officeSubdomain: string | undefined,
  slug: string,
): void {
  const office = officeSubdomain?.trim();
  if (!office) return;
  revalidateLpPublicCache(office, slug);
}

/** Salva (cria/sobrescreve) uma LP da conta no banco do Projeto B. */
export async function saveLpAction(lp: StoredLp): Promise<ActionResult> {
  let session: Awaited<ReturnType<typeof requireLpSession>>;
  try {
    session = await requireLpSession();
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!lp?.slug || !lp?.schema) {
    return { ok: false, error: "LP inválida (faltou slug ou schema)." };
  }

  try {
    const meta = await getLpMeta(session, lp.slug);
    if (meta && !canEditLp(session, meta.createdByUserId)) {
      return { ok: false, error: LP_ERRORS.EDIT_LP_OWN_ONLY };
    }

    await saveLp(session, lp);

    const office =
      lp.officeSubdomain?.trim() ||
      meta?.officeSubdomain?.trim() ||
      (await resolveOfficeSubdomain(session));
    const isPublished =
      lp.status === "published" || meta?.status === "published";
    if (isPublished) {
      revalidatePublishedPublic(office, lp.slug);
    }

    revalidatePath("/");
    revalidatePath(`/lp/${lp.slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao salvar.") };
  }
}

/** Publica uma LP (status draft → published). */
export async function publishLpAction(slug: string): Promise<ActionResult> {
  let session: Awaited<ReturnType<typeof requireLpSession>>;
  try {
    session = await requireLpSession();
    await assertCanEditLp(slug);
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    const meta = await getLpMeta(session, slug);
    await publishLp(session, slug);
    const office =
      meta?.officeSubdomain?.trim() || (await resolveOfficeSubdomain(session));
    revalidatePublishedPublic(office, slug);
    revalidatePath("/");
    revalidatePath(`/lp/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao publicar.") };
  }
}

/** Despublica uma LP (status published → draft). */
export async function unpublishLpAction(slug: string): Promise<ActionResult> {
  let session: Awaited<ReturnType<typeof requireLpSession>>;
  try {
    session = await requireLpSession();
    await assertCanEditLp(slug);
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    const meta = await getLpMeta(session, slug);
    await unpublishLp(session, slug);
    const office =
      meta?.officeSubdomain?.trim() || (await resolveOfficeSubdomain(session));
    revalidatePublishedPublic(office, slug);
    revalidatePath("/");
    revalidatePath(`/lp/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao despublicar.") };
  }
}

/** Remove uma LP (somente owner/super_admin via RLS). */
export async function deleteLpAction(
  slug: string,
  deleteEverything = false,
): Promise<ActionResult> {
  let session: Awaited<ReturnType<typeof requireLpSession>>;
  try {
    session = await requireLpSession();
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    await deleteLp(session, slug);
    if (deleteEverything) {
      await deleteOrphanedAssets(session);
    }
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao excluir.") };
  }
}
