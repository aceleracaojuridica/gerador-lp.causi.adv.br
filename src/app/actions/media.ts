"use server";

import type { ActionResult } from "@/app/actions/lps";
import { mapLpDbError } from "@/lib/errors";
import { persistMediaToGallery } from "@/lib/landing-pages/media-storage";
import type { MediaResource } from "@/lib/landing-pages/media-types";
import { requireLpSession } from "@/lib/session";

function toMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) {
    if (err.message === "UNAUTHENTICATED") return "Não autenticado.";
    if (err.message === "FORBIDDEN")
      return "Acesso negado ao gerador de landing pages.";
    const mapped = mapLpDbError(err);
    return mapped.description || err.message;
  }
  return fallback;
}

export type UploadMediaResult = ActionResult & { url?: string };

/** Upload de mídia para a galeria da conta (editor). */
export async function uploadLpMediaAction(
  _slug: string,
  _resource: MediaResource,
  source: string,
  originalFilename?: string,
): Promise<UploadMediaResult> {
  try {
    const session = await requireLpSession();
    const url = await persistMediaToGallery(session, source, originalFilename);
    return { ok: true, url };
  } catch (err) {
    return {
      ok: false,
      error: toMessage(err, "Erro ao enviar imagem."),
    };
  }
}

/** Atalho: envia para galeria e retorna URL pública. */
export async function persistLpMediaAction(
  slug: string,
  resource: MediaResource,
  source: string,
  originalFilename?: string,
): Promise<UploadMediaResult> {
  return uploadLpMediaAction(slug, resource, source, originalFilename);
}
