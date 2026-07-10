import type React from "react";
import { SettingsNav } from "@/components/settings-nav";
import { SettingsNavMobile } from "@/components/settings-nav-mobile";
import { requireLpAccessOrRedirect } from "@/lib/session";

export default async function ConfiguracoesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireLpAccessOrRedirect();

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full max-w-full">
      {/* Sidebar de Navegação - Apenas Desktop */}
      <aside className="hidden md:block md:w-80 lg:w-90 border-b md:border-b-0 md:border-r border-border bg-card shrink-0 overflow-y-auto max-h-[40dvh] md:max-h-full">
        <div className="px-4 py-4 md:px-6 md:pt-6 md:pb-6 border-b border-border">
          <h1 className="text-lg md:text-2xl font-bold text-foreground mb-1 md:mb-2">
            Configurações
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        <div className="px-4 py-2 md:px-6 md:pb-6">
          <SettingsNav />
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 relative pb-20 md:pb-0">{children}</div>

      {/* Menu Mobile Flutuante */}
      <SettingsNavMobile />
    </div>
  );
}
