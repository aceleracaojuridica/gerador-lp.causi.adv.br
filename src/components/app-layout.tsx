"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { AppChromeProvider } from "./app-chrome-context";
import { AppSidebar } from "./app-sidebar";
import { SystemBar } from "./system-bar";

/**
 * Layout principal do app: compõe SystemBar, Sidebar e a área de conteúdo para todas as rotas protegidas.
 *
 * @remarks
 * Gerencia o estado `isSidebarOpen` (mobile overlay). A `SystemBar` é exibida
 * condicionalmente com base em `session.hasSharedAccounts || accessLevel === 999`.
 */

interface AppLayoutProps {
  children: React.ReactNode;
  /** Link do Kanban de deals na sidebar — cookie ou `/oportunidades`. */
  dealsHref?: string;
}

export function AppLayout({
  children,
  dealsHref = "/oportunidades",
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Recolhida no desktop a pedido da página (hoje: o editor de LP).
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const currentPath = usePathname();
  const session = useSession();

  const chrome = useMemo(
    () => ({ sidebarHidden, setSidebarHidden }),
    [sidebarHidden],
  );

  const showSystemBar =
    session.hasSharedAccounts || session.role.accessLevel === 999;

  return (
    <AppChromeProvider value={chrome}>
      <div className="min-h-dvh max-h-dvh h-dvh bg-background text-foreground overflow-hidden flex flex-col">
        {/* Top-bar horizontal - Sempre no topo */}
        {showSystemBar && <SystemBar />}

        <main
          className={`flex max-w-full mx-auto shadow-lg relative w-full grow ${
            showSystemBar
              ? "overflow-hidden max-h-[calc(100dvh-50px)]"
              : "overflow-hidden max-h-full"
          }`}
        >
          <AppSidebar
            currentPath={currentPath}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            hiddenOnDesktop={sidebarHidden}
            dealsHref={dealsHref}
          />

          {/* Renderiza conteudo das paginas */}
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </AppChromeProvider>
  );
}
