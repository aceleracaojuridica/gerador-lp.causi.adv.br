/**
 * Persistência do último funil acessado no cookie HTTP-only `causi_pipeline`.
 *
 * @remarks
 * Mesmo padrão de `causi_act` (ver `lib/session/actions.ts`): cookie HTTP-only,
 * `path: "/"`, `maxAge` de 30 dias. Guarda o id numérico do funil ativo.
 *
 * `cookies().set()` só é permitido em Server Actions / Route Handlers — nunca
 * durante o render de um Server Component. Por isso a gravação do cookie ao
 * acessar `/oportunidades/[pipelineId]` é feita via `setPipelineCookieAction`
 * (Server Action chamada no client, análogo a `syncSessionCookieAction`).
 * A leitura (`getPipelineCookie`) é segura em render.
 *
 * Ciclo de vida:
 * - Gravado: ao acessar um funil válido e ao trocar de funil no combobox.
 * - Lido: em `/oportunidades` (sem id) para redirecionar ao último funil.
 * - Limpo: em `switchAccountAction` (troca de conta) — o funil pertence à conta.
 */
import "server-only";

import { cookies } from "next/headers";

export const PIPELINE_COOKIE_NAME = "causi_pipeline";

const PIPELINE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Lê o funil ativo do cookie. Retorna `null` se ausente ou inválido. Seguro em render. */
export async function getPipelineCookie(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(PIPELINE_COOKIE_NAME)?.value;
  if (!raw) return null;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Grava o funil ativo no cookie.
 *
 * @remarks Só funciona em Server Action / Route Handler (nunca em render).
 */
export async function setPipelineCookie(pipelineId: number): Promise<void> {
  const jar = await cookies();
  jar.set(PIPELINE_COOKIE_NAME, String(pipelineId), PIPELINE_COOKIE_OPTIONS);
}

/**
 * Remove o cookie de funil ativo.
 *
 * @remarks Só funciona em Server Action / Route Handler (nunca em render).
 */
export async function deletePipelineCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(PIPELINE_COOKIE_NAME);
}
