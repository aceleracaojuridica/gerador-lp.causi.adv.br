import { env } from "@/lib/env";

const MEDIA_PUBLIC_BASE_URL = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/media/`;

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizeMediaPath(path: string): string {
  return path.replace(/^\/+/, "").replace(/^media\//, "");
}

/**
 * Resolve uma URL pública estável do bucket `media` a partir do path relativo.
 */
export function resolveMediaPublicUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (isAbsoluteUrl(value)) {
    return value;
  }

  return `${MEDIA_PUBLIC_BASE_URL}${normalizeMediaPath(value)}`;
}

/**
 * Extrai o path relativo canônico de uma referência legada ou já normalizada.
 */
export function extractMediaPath(value: string | null): string | null {
  if (!value) {
    return null;
  }

  if (!isAbsoluteUrl(value)) {
    return normalizeMediaPath(value);
  }

  if (!value.startsWith(MEDIA_PUBLIC_BASE_URL)) {
    return null;
  }

  return decodeURIComponent(value.slice(MEDIA_PUBLIC_BASE_URL.length));
}
