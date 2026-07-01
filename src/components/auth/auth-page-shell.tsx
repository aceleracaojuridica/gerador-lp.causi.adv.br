import type { ReactNode } from "react";
import CausiLogotipo from "@/components/icons/causi-logotipo";

interface AuthPageShellProps {
  children: ReactNode;
}

/** Shell de layout para páginas públicas de autenticação. */
export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-20 shrink-0 items-center justify-center border-b border-border px-4">
        <CausiLogotipo className="h-10" />
      </header>
      <main className="flex flex-1 justify-center overflow-y-auto">
        <div className="flex w-full max-w-160 min-h-full flex-col items-center justify-center px-4 py-8 sm:px-8 md:px-12 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
