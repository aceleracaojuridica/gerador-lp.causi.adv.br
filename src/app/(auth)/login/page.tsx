import { AuthAdvisor } from "@/components/auth/auth-advisor";
import { AuthFormShell } from "@/components/auth/auth-form-shell";
import SigninForm from "@/forms/SignInForm/signin-form";
import { getSafeRedirectPath } from "@/lib/auth/auth";
import { getParam, type SearchParams } from "@/lib/search-params";

/**
 * Rota pública de login — processa `searchParams` no servidor e delega o formulário ao client.
 *
 * @remarks
 * A sessão SSR é mantida pelo `proxy.ts`. `nextPath` preserva o destino original após
 * autenticação.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = getParam(params, "status");
  const email = getParam(params, "email");
  const nextPath = getSafeRedirectPath(getParam(params, "next"), "/");

  if (status === "expired-link") {
    return <AuthAdvisor type="expired-link" />;
  }

  if (status === "confirm-email") {
    return (
      <AuthAdvisor
        type="confirm-email"
        email={email}
        showResend
        resend={{ kind: "signup", nextPath, fallbackNextPath: "/" }}
      />
    );
  }

  return (
    <AuthFormShell bare title="Login" description="Entre com sua conta Causi">
      <SigninForm nextPath={nextPath} />
    </AuthFormShell>
  );
}
