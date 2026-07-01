import { getAppOrigin } from "@/lib/env";

const AUTH_ERROR_MESSAGES: Array<[string, string]> = [
  ["invalid login credentials", "E-mail ou senha inválidos."],
  ["email not confirmed", "Confirme seu e-mail antes de entrar na plataforma."],
  [
    "user already registered",
    "Já existe uma conta com este e-mail. Faça login para continuar.",
  ],
  [
    "signup requires a valid password",
    "Defina uma senha válida para concluir seu cadastro.",
  ],
  [
    "password should be at least",
    "Sua senha não atende aos requisitos mínimos de segurança.",
  ],
  [
    "for security purposes, you can only request this after",
    "Aguarde alguns instantes antes de solicitar um novo e-mail.",
  ],
  [
    "email rate limit exceeded",
    "Limite de envio de e-mails atingido. Aguarde alguns instantes e tente novamente.",
  ],
  [
    "rate limit exceeded",
    "Muitas tentativas em sequência. Aguarde um pouco e tente novamente.",
  ],
  [
    "otp expired",
    "O link enviado expirou. Solicite um novo e-mail para continuar.",
  ],
  [
    "token has expired or is invalid",
    "O link enviado expirou ou já foi utilizado. Solicite um novo acesso.",
  ],
];

/**
 * Constrói a URL de callback SSR para fluxos de e-mail do Supabase Auth.
 *
 * Usa `APP_URL` como origin confiável (não `window.location.origin`, que pode ser
 * manipulado) e aponta para `/auth/callback`, que processa `token_hash` via
 * `verifyOtp` no servidor.
 */
export function buildAuthCallbackUrl(nextPath: string) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : getAppOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", getSafeRedirectPath(nextPath));
  return callbackUrl.toString();
}

/**
 * Valida e normaliza um caminho de redirect para prevenir Open Redirect.
 *
 * Decodifica o candidato com `decodeURIComponent` antes de validar para
 * bloquear ataques via URL encoding (ex: `/%2F%2Fevil.com`).
 */
export function getSafeRedirectPath(
  value?: string | null,
  fallbackPath = "/",
) {
  const candidate = typeof value === "string" ? value.trim() : "";

  if (!candidate) {
    return fallbackPath;
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(candidate);
  } catch {
    return fallbackPath;
  }

  if (
    !decoded.startsWith("/") ||
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\r\n]/.test(decoded) ||
    // Bloqueia protocolos embutidos no path (ex: /javascript:, /data:)
    /^\/[a-z][a-z0-9+\-.]*:/i.test(decoded)
  ) {
    return fallbackPath;
  }

  return decoded;
}

export function getAuthErrorMessage(error: { message?: string } | null) {
  const errorMessage = error?.message?.toLowerCase().trim();

  if (!errorMessage) {
    return "Não foi possível concluir a autenticação. Tente novamente.";
  }

  const matchedMessage = AUTH_ERROR_MESSAGES.find(([pattern]) =>
    errorMessage.includes(pattern),
  );

  return matchedMessage?.[1] ?? "Não foi possível concluir a autenticação.";
}
