import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
    "/",
  );
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  const supabase = await createClient({
    request,
    response,
  });

  let authSuccess = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) authSuccess = true;
  }

  if (!authSuccess && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (!error) authSuccess = true;
  }

  if (!authSuccess) {
    return NextResponse.redirect(
      new URL("/login?status=expired-link", request.url),
    );
  }

  // Verificar se o usuário precisa de provisioning (public.users + account)
  // Se nextPath já aponta para /confirmar, não precisa checar — já vai provisionar
  if (!nextPath.startsWith("/confirmar")) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: publicUser } = await supabase
        .from("users")
        .select("account_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!publicUser?.account_id) {
        const confirmarUrl = new URL("/confirmar", request.url);
        confirmarUrl.searchParams.set("next", nextPath);
        const provisionResponse = NextResponse.redirect(confirmarUrl);
        for (const cookie of response.cookies.getAll()) {
          provisionResponse.cookies.set(cookie);
        }
        return provisionResponse;
      }
    }
  }

  return response;
}

type SessionConsumePayload = {
  access_token?: unknown;
  refresh_token?: unknown;
  next?: unknown;
};

export async function POST(request: NextRequest) {
  let payload: SessionConsumePayload = {};

  try {
    payload = (await request.json()) as SessionConsumePayload;
  } catch {
    return NextResponse.json({ message: "Payload inválido." }, { status: 400 });
  }

  const accessToken =
    typeof payload.access_token === "string" ? payload.access_token : "";
  const refreshToken =
    typeof payload.refresh_token === "string" ? payload.refresh_token : "";
  const nextPath = getSafeRedirectPath(
    typeof payload.next === "string" ? payload.next : null,
    "/",
  );

  if (!accessToken || !refreshToken) {
    return NextResponse.json(
      { message: "Token de sessão ausente." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ redirectTo: nextPath }, { status: 200 });
  const supabase = await createClient({
    request,
    response,
  });
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return NextResponse.json(
      { message: "Não foi possível concluir a autenticação." },
      { status: 400 },
    );
  }

  return response;
}
