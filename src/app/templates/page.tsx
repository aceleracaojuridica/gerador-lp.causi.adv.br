import { OpenInNew } from "@material-symbols-svg/react/rounded";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TEMPLATES, templatePreviewSrc } from "@/lib/landing-pages/templates";

export const metadata: Metadata = {
  title: "Templates de Landing Pages | Causi",
  description:
    "Escolha o template ideal para o site do seu escritório de advocacia. Designs estratégicos para converter mais clientes.",
};

function TemplateCard({
  id,
  name,
  description,
}: {
  id: string;
  name: string;
  description: string;
}) {
  const hasPreview = id !== "autoridade";
  const previewSrc = templatePreviewSrc(id);

  return (
    <article className="group">
      <Link
        href={`/templates/${id}`}
        className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#111827]/80 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-1 hover:border-[#005CE5]/40 hover:shadow-[0_32px_64px_-16px_rgba(0,92,229,0.25)]"
      >
        <div className="relative aspect-[510/340] w-full overflow-hidden bg-[#0a0f1a]">
          {hasPreview ? (
            <Image
              src={previewSrc}
              alt={`Prévia do template ${name}`}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0a0f1a] px-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl border border-[#005CE5]/30 bg-[#005CE5]/10">
                <span className="text-2xl font-bold text-[#5b9cff]">A</span>
              </div>
              <span className="text-sm font-semibold text-white/90">
                Template {name}
              </span>
              <span className="max-w-xs text-xs text-white/50">
                Visualização interativa disponível no preview
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
          <div className="space-y-2">
            <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
              {name}
            </h2>
            <p className="text-sm leading-relaxed text-white/60">
              {description}
            </p>
          </div>

          <span className="mt-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors group-hover:border-[#005CE5]/50 group-hover:bg-[#005CE5]/10 group-hover:text-[#7eb4ff]">
            Ver template
            <OpenInNew className="size-5 fill-current" />
          </span>
        </div>
      </Link>
    </article>
  );
}

export default function TemplatesGalleryPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060a12] text-white">
      {/* Background atmosférico */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 bg-[#060a12]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(6,10,18,0.55) 0%, rgba(6,10,18,0.92) 55%, rgba(6,10,18,1) 100%), url('https://bonafide.digital/materiais/wp-content/uploads/2022/10/site-bg-1600x600.jpg')",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#005CE5]/70 to-transparent" />
        <div className="absolute left-1/2 top-[18%] h-40 w-[min(90vw,720px)] -translate-x-1/2 rounded-full bg-[#005CE5]/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 pt-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="inline-flex shrink-0">
            <Image
              src="/causi-logo-light.svg"
              alt="Causi"
              width={180}
              height={54}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:bg-white/10 hover:text-white"
          >
            Voltar ao app
          </Link>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:px-8">
        <section className="mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-4xl text-center sm:mb-16">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Templates de Landing Pages para sua advocacia
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg">
              Designs estratégicos para passar autoridade, segurança e converter
              mais clientes para o seu escritório.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                id={template.id}
                name={template.name}
                description={template.description}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#04070d]/90">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
            <Link href="/" className="inline-flex">
              <Image
                src="/causi-logo-light.svg"
                alt="Causi"
                width={160}
                height={48}
                className="h-8 w-auto opacity-90"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/55">
              Gerador de landing pages para advogados brasileiros. CRM, WhatsApp
              Inbox e follow-up automático em uma plataforma.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>
              © {new Date().getFullYear()} Causi. Todos os direitos reservados.
            </span>
            <Link href="/" className="transition-colors hover:text-white/75">
              Acessar o gerador
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
