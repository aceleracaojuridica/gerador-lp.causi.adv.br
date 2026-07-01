import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AuthFormShellProps {
  title: string;
  description: ReactNode;
  children: ReactNode;
  footerLabel?: string;
  footerHref?: string;
  footerText?: string;
}

/**
 * Wrapper padronizado para formulários de autenticação com título, descrição e link de navegação.
 *
 * @remarks
 * O rodapé (link auxiliar) é opcional — omitido em estados como confirmação de e-mail e
 * redefinição de senha para simplificar o layout.
 */
export function AuthFormShell({
  title,
  description,
  children,
  footerLabel,
  footerHref,
  footerText,
}: AuthFormShellProps) {
  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {children}
      </div>

      {footerLabel && footerHref && footerText ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">{footerText}</span>
          <Button variant="secondary" size="xs" asChild>
            <Link href={footerHref}>{footerLabel}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
