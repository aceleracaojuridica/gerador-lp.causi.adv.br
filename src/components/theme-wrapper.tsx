"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * Componente client-only que envolve o app com `ThemeProvider` do next-themes.
 *
 * @remarks
 * O next-themes acessa `localStorage` e injeta `className` no `<html>`, causando
 * hydration mismatch no servidor. `suppressHydrationWarning` no `<html>` cobre
 * os atributos injetados.
 */
export function ThemeWrapper({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  // next-themes injeta <script> no client; React 19 emite warning falso-positivo.
  // No SSR o script roda normalmente; no client usamos type inerte para silenciar.
  const scriptProps =
    typeof window === "undefined"
      ? undefined
      : ({ type: "application/json" } as const);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      scriptProps={scriptProps}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
