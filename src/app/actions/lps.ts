"use server";

import { revalidatePath } from "next/cache";
import { ACCESS_DENIED_ERROR } from "@/lib/errors";
import {
  deleteLp,
  publishLp,
  saveLp,
  unpublishLp,
} from "@/lib/landing-pages/lp-store";
import type { StoredLp } from "@/lib/landing-pages/schema";
import { requireLpSession } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return "Não autenticado.";
    if (err.message === "FORBIDDEN") return ACCESS_DENIED_ERROR;
    return err.message;
  }
  return fallback;
}

/** Salva (cria/sobrescreve) uma LP do usuário no banco do Projeto B. */
export async function saveLpAction(lp: StoredLp): Promise<ActionResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!lp?.slug || !lp?.schema) {
    return { ok: false, error: "LP inválida (faltou slug ou schema)." };
  }

  try {
    await saveLp(userId, lp);
    revalidatePath("/");
    revalidatePath(`/lp/${lp.slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao salvar.") };
  }
}

/** Publica uma LP (status draft → published). */
export async function publishLpAction(slug: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    await publishLp(userId, slug);
    revalidatePath("/");
    revalidatePath(`/lp/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao publicar.") };
  }
}

/** Despublica uma LP (status published → draft). */
export async function unpublishLpAction(slug: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    await unpublishLp(userId, slug);
    revalidatePath("/");
    revalidatePath(`/lp/${slug}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao despublicar.") };
  }
}

/** Remove uma LP do usuário pelo slug. */
export async function deleteLpAction(slug: string): Promise<ActionResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return { ok: false, error: toMessage(err, "Não autenticado.") };
  }

  if (!slug) return { ok: false, error: "Slug não informado." };

  try {
    await deleteLp(userId, slug);
    revalidatePath("/");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao excluir.") };
  }
}
