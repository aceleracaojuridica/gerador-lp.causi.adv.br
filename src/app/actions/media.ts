"use server";

import type { ActionResult } from "@/app/actions/lps";
import { getUserSubdomain } from "@/lib/landing-pages/lp-store";
import {
  buildMediaPath,
  persistMediaResource,
  uploadMediaToPath,
} from "@/lib/landing-pages/media-storage";
import type { MediaResource } from "@/lib/landing-pages/media-types";
import { requireLpSession } from "@/lib/session";

function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export type UploadMediaResult = ActionResult & { url?: string };

/** Upload imediato de mídia para o Supabase Storage (editor). */
export async function uploadLpMediaAction(
  slug: string,
  resource: MediaResource,
  source: string,
): Promise<UploadMediaResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return {
      ok: false,
      error: toMessage(err, "Não autenticado."),
    };
  }

  const safeSlug = slug?.trim();
  if (!safeSlug) return { ok: false, error: "Slug não informado." };
  if (!source?.trim()) return { ok: false, error: "Imagem vazia." };

  try {
    const subdomain = await getUserSubdomain(userId);
    const path = buildMediaPath(subdomain, userId, safeSlug, resource);
    const url = await uploadMediaToPath(source, path);
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao enviar imagem.") };
  }
}

/** Atalho para upload com persistência por recurso. */
export async function persistLpMediaAction(
  slug: string,
  resource: MediaResource,
  source: string,
): Promise<UploadMediaResult> {
  let userId: string;
  try {
    userId = (await requireLpSession()).user.id;
  } catch (err) {
    return {
      ok: false,
      error: toMessage(err, "Não autenticado."),
    };
  }

  try {
    const subdomain = await getUserSubdomain(userId);
    const url = await persistMediaResource(source, {
      subdomain,
      userId,
      slug,
      resource,
    });
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: toMessage(err, "Erro ao salvar imagem.") };
  }
}
