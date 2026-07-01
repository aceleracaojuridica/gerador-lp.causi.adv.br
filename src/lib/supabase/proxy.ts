import { type NextRequest, NextResponse } from "next/server";
import {
  isPublicLpSlugPath,
  lpSubdomainSlug,
} from "@/lib/landing-pages/public-routing";
import { getSafeRedirectPath } from "../auth/auth";
import { createClient } from "./server";

const AUTH_ROUTES = new Set([
  "/login",
  "/cadastrar",
  "/confirmar",
  "/redefinir",
]);

function isPublicRoute(pathname: string) {
  return (
    AUTH_ROUTES.has(pathname) ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/")
  );
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get("host") ?? "";

  const subdomainSlug = lpSubdomainSlug(host);
  if (subdomainSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/${subdomainSlug}`;
    return NextResponse.rewrite(url);
  }

  if (isPublicLpSlugPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const response = {
    current: NextResponse.next({
      request,
    }),
  };

  const supabase = await createClient({
    request,
    response,
  });

  const { data: claimsData, error } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims?.sub) && !error;
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const publicRoute = isPublicRoute(pathname);

  if (!isAuthenticated && !publicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      getSafeRedirectPath(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        "/",
      ),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthRoute) {
    // /confirmar é a página de provisioning — requer autenticação para
    // executar a RPC que cria public.users, accounts e pipelines.
    if (pathname === "/confirmar") {
      return response.current;
    }

    // Permite que usuários autenticados acessem a página de redefinir apenas se
    // estiverem no modo de atualização (fluxo de recuperação de senha).
    const isRecoveryUpdate =
      pathname === "/redefinir" &&
      request.nextUrl.searchParams.get("mode") === "update";

    if (!isRecoveryUpdate) {
      const nextPath = getSafeRedirectPath(
        request.nextUrl.searchParams.get("next"),
        "/",
      );
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  return response.current;
}
