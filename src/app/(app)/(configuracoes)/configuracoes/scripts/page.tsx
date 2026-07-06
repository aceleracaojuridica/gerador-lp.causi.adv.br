import { ScriptsConfigForm } from "@/forms/GlobalConfigForm";
import { getConfig } from "@/lib/landing-pages/config";
import { getSession, requireSession } from "@/lib/session";

/** Pagina de scripts avancados (head/body/footer) das landing pages. */
export default async function ScriptsPage() {
  const session = await getSession();
  requireSession(session);

  const initialData = await getConfig();

  return (
    <div className="absolute inset-0 flex h-full w-full max-w-full flex-1 flex-col">
      <header className="sticky top-0 z-10 hidden shrink-0 border-b border-border bg-background md:block">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 md:px-0 md:py-6">
          <h1 className="mb-1 text-xl font-bold text-foreground md:mb-2 md:text-2xl">
            Scripts avancados
          </h1>
          <p className="text-sm text-muted-foreground">
            HTML/JS customizado injetado no head, inicio e rodape das landing
            pages.
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="mx-auto w-full max-w-4xl px-6 pt-6 md:px-0 md:pt-8">
          <ScriptsConfigForm initialData={initialData} />
        </div>
      </div>
    </div>
  );
}
