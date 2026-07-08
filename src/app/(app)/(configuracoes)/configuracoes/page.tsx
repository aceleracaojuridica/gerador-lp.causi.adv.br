import { VisualConfigForm } from "@/forms/GlobalConfigForm";
import {
  ensureLpAccount,
  getLpAccount,
} from "@/lib/landing-pages/account-store";
import { getConfig } from "@/lib/landing-pages/config";
import { getSession, requireSession } from "@/lib/session";

/** Pagina de configuracoes visuais (fontes e subdominio) das landing pages. */
export default async function ConfiguracoesPage() {
  const session = await getSession();
  requireSession(session);

  await ensureLpAccount(session);
  const account = await getLpAccount(session);
  const initialData = await getConfig();

  return (
    <div className="absolute inset-0 flex h-full w-full max-w-full flex-1 flex-col">
      <header className="sticky top-0 z-10 hidden shrink-0 border-b border-border bg-background md:block">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-0 md:py-6">
          <h1 className="mb-1 text-xl font-bold text-foreground md:mb-2 md:text-2xl">
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground">
            Tipografia, contatos e endereço padrão do escritório para as landing
            pages.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto w-full max-w-4xl px-6 pt-6 md:px-0 md:pt-8">
          <VisualConfigForm
            initialData={initialData}
            initialOfficeSubdomain={account?.office_subdomain ?? ""}
            accountName={session.account.name}
            canEditSubdomain={session.role.accessLevel >= 100}
          />
        </div>
      </div>
    </div>
  );
}
