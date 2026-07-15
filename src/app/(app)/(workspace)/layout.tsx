import { WorkspaceNav } from "@/components/workspace-nav";

/**
 * Layout da área de landing pages: sub-navegação lateral (Landing pages ·
 * Imagens · Contatos) + o conteúdo da rota ativa. Fica dentro do AppLayout
 * (sidebar externa de ícones). O wizard `/nova`, o editor `/lp/[slug]` e
 * `/configuracoes` ficam FORA deste grupo, então não têm a sub-nav.
 */
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden">
      <WorkspaceNav />
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
