"use client";

import { LinkOff, Mail, Report, Widgets } from "@material-symbols-svg/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useAuthEmailResend } from "@/hooks/use-auth-email-resend";

export type AuthAdvisorType =
  | "confirm-email"
  | "link-sent"
  | "expired-link"
  | "provisioning-error"
  | "configuring-account"
  | "configured-account";

type AuthAdvisorResendConfig =
  | {
      kind: "signup";
      nextPath: string;
      fallbackNextPath?: string;
      cooldownSeconds?: number;
    }
  | {
      kind: "recovery";
      nextPath: string;
      fallbackNextPath?: string;
      cooldownSeconds?: number;
    };

/**
 * Props para o componente AuthAdvisor.
 * Define o estado visual, e-mail de destino e comportamentos de reenvio.
 */
export interface AuthAdvisorProps {
  type: AuthAdvisorType;
  email?: string;
  loginUrl?: string;
  onResend?: () => Promise<void> | void;
  onRetry?: () => void;
  showResend?: boolean;
  isNewLink?: boolean;
  resendDisabled?: boolean;
  resendLabel?: string;
  resend?: AuthAdvisorResendConfig;
}

function AuthAdvisorResendButton({
  kind,
  email,
  nextPath,
  fallbackNextPath,
  cooldownSeconds,
}: AuthAdvisorResendConfig & { email?: string }) {
  const { resend, canResend, cooldownRemainingSeconds } = useAuthEmailResend({
    kind,
    email,
    nextPath,
    fallbackNextPath,
    cooldownSeconds,
    missingEmailMessage:
      kind === "signup"
        ? "Informe novamente seu e-mail para solicitar uma nova confirmação."
        : "Informe novamente seu e-mail para solicitar um novo link.",
    successMessage:
      kind === "signup"
        ? "Enviamos um novo e-mail de confirmação."
        : "Enviamos um novo link para redefinição de senha.",
  });

  const label =
    cooldownRemainingSeconds > 0
      ? `Reenviar em ${cooldownRemainingSeconds}s`
      : "Reenviar e-mail";

  return (
    <Button variant="outline" onClick={resend} disabled={!canResend}>
      {label}
    </Button>
  );
}

/**
 * Componente de feedback para telas de autenticação (e-mail confirmado, link expirado, reenvio).
 *
 * @remarks
 * O botão de reenvio só é exibido quando `onResend` é fornecido. Sem ele, o estado de
 * "aguardando confirmação" apresenta apenas o texto, sem ação.
 */
export function AuthAdvisor({
  type,
  email,
  loginUrl = "/login",
  onResend,
  onRetry,
  showResend = false,
  isNewLink = false,
  resendDisabled = false,
  resendLabel,
  resend,
}: AuthAdvisorProps) {
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!onResend) return;
    setIsResending(true);
    try {
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  const showResendButton = Boolean(showResend || onResend || resend);

  const resendButton = resend ? (
    <AuthAdvisorResendButton {...resend} email={email} />
  ) : onResend ? (
    <Button
      variant="outline"
      onClick={handleResend}
      disabled={isResending || resendDisabled}
    >
      {isResending ? "Enviando..." : (resendLabel ?? "Reenviar e-mail")}
    </Button>
  ) : null;

  const configs = {
    "confirm-email": {
      icon: <Mail className="size-14 text-muted-foreground/40" />,
      title: "Confirmar E-mail",
      description: (
        <>
          Confirme seu e-mail para continuar. Verifique sua caixa de entrada, ou
          caso não tenha recebido, clique no botão abaixo para receber um novo
          e-mail de confirmação. Se o link expirar, solicite um novo e-mail.
        </>
      ),
      actions: (
        <div className="flex gap-2 w-full justify-center">
          {showResendButton ? resendButton : null}
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href={loginUrl}>Voltar ao Login</Link>
          </Button>
        </div>
      ),
    },
    "link-sent": {
      icon: <Mail className="size-14 text-muted-foreground/40" />,
      title: "Link Enviado",
      description: (
        <>
          Enviamos {isNewLink ? "um novo" : "um"} link de{" "}
          {isNewLink ? "confirmação" : "redefinição de senha"} para{" "}
          <strong>{email}</strong>. Acesse sua caixa de entrada e clique no
          botão para {isNewLink ? "continuar" : "redefinir sua senha"}.
          Verifique também a caixa de spam.
        </>
      ),
      actions: (
        <div className="flex gap-2 w-full">
          {showResendButton ? resendButton : null}
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href={loginUrl}>Voltar ao login</Link>
          </Button>
        </div>
      ),
    },
    "expired-link": {
      icon: <LinkOff className="size-14 text-muted-foreground/40" />,
      title: "Link Expirado",
      description: (
        <>
          O link que você utilizou expirou. Vá para a página de login e solicite
          um novo e-mail de redefinição de senha.
        </>
      ),
      actions: (
        <div className="flex gap-2 w-full justify-center">
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href={loginUrl}>Ir para o login</Link>
          </Button>
        </div>
      ),
    },
    "provisioning-error": {
      icon: <Report className="size-14 text-muted-foreground/40" />,
      title: "Erro na Configuração",
      description:
        "Não foi possível concluir a configuração da sua conta. Tente novamente.",
      actions: (
        <div className="flex gap-2 w-full justify-center">
          {onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Tentar novamente
            </Button>
          ) : null}
          <Button asChild variant="link" className="text-muted-foreground">
            <Link href={loginUrl}>Voltar ao Login</Link>
          </Button>
        </div>
      ),
    },
    "configuring-account": {
      icon: <Widgets className="size-14 text-muted-foreground/40" />,
      title: "Configurando Conta",
      description:
        "Aguarde enquanto concluímos a configuração inicial da sua conta!",
      actions: (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ),
    },
    "configured-account": {
      icon: <Widgets className="size-14 text-muted-foreground/40" />,
      title: "Configuração Concluída",
      description: "Tudo pronto! Você será redirecionado para o início.",
      actions: (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ),
    },
  };

  const config = configs[type];

  return (
    <div className="flex w-full max-w-160 flex-col items-center text-center">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-muted">
        {config.icon}
      </div>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
        {config.title}
      </h1>
      <p className="mb-8 text-base text-muted-foreground">
        {config.description}
      </p>
      <div className="mx-auto w-full max-w-xs">{config.actions}</div>
    </div>
  );
}
