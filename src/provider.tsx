import { NuqsAdapter } from "nuqs/adapters/next/app";
import type * as React from "react";
import { TooltipProvider } from "./components/ui/tooltip";

/**
 * Wrapper de providers server-safe: `TooltipProvider` e `NuqsAdapter`.
 *
 * @remarks
 * `ThemeProvider` foi movido para `ThemeWrapper` por causar hydration mismatch
 * (acessa `localStorage` no servidor).
 */
export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <NuqsAdapter>{children}</NuqsAdapter>
    </TooltipProvider>
  );
}
