import { type NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { getSession } from "@/lib/session/get-session";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorna uma resposta JSON garantindo que os cookies da baseResponse (autenticação)
 * sejam incluídos. Essencial para manter a sessão no Supabase SSR.
 */
export function jsonWithCookies(
  baseResponse: NextResponse,
  data: unknown,
  init?: Parameters<typeof NextResponse.json>[1],
) {
  const res = NextResponse.json(data, init);
  for (const cookie of baseResponse.cookies.getAll()) {
    res.cookies.set(cookie);
  }
  return res;
}

/**
 * Extrai o conteúdo textual de uma mensagem, lidando com formatos variados
 * (string direta ou objeto { text: string }).
 */
export function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (
    content &&
    typeof content === "object" &&
    "text" in content &&
    typeof (content as Record<string, unknown>).text === "string"
  ) {
    return (content as Record<string, unknown>).text as string;
  }
  if (content == null) return "";
  try {
    return JSON.stringify(content);
  } catch {
    return String(content);
  }
}

/**
 * Autentica uma rota, retornando o Supabase client, a sessão e a baseResponse.
 * Se falhar, retorna um objeto com o erro pronto para ser retornado pela rota.
 */
export async function authenticateRoute(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 },
      ),
    } as const;
  }

  const baseResponse = NextResponse.next();
  const supabase = await createClient({ request, response: baseResponse });

  const { data: claims } = await supabase.auth.getClaims();
  if (!claims) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Não autenticado." },
        { status: 401 },
      ),
    } as const;
  }

  return {
    ok: true,
    session,
    supabase,
    baseResponse,
    accountId: session.account.id,
  } as const;
}

/**
 * Faz o parse do body JSON de uma request usando um schema Zod.
 */
export async function parseJsonBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
) {
  try {
    const rawBody = await request.json();
    const parsed = schema.safeParse(rawBody);
    if (!parsed.success) {
      return {
        ok: false,
        response: NextResponse.json(
          { message: "Payload inválido.", errors: parsed.error.format() },
          { status: 400 },
        ),
      } as const;
    }
    return { ok: true, data: parsed.data } as const;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "JSON inválido." },
        { status: 400 },
      ),
    } as const;
  }
}
