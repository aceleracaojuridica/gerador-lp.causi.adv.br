import type { Office } from "@/lib/landing-pages/schema";

// Renderiza a logo enviada (data URL ou caminho). Sem arquivo, mostra um
// wordmark textual com o nome do escritório como placeholder.
// tone: "light" para fundos escuros (texto claro) | "dark" para fundos claros (texto navy).
export function LogoMark({
  office,
  className = "",
  tone = "light",
}: {
  office: Office;
  className?: string;
  tone?: "light" | "dark";
}) {
  if (office.logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={office.logoSrc}
        alt={office.fullName || office.name}
        className={`h-auto w-[200px] object-contain md:w-[240px] ${className}`}
      />
    );
  }

  const wordColor = tone === "dark" ? "text-lp-brand" : "text-white";
  const rule = tone === "dark" ? "bg-lp-accent/50" : "bg-lp-accent-soft/60";
  const nome = office.name || "Seu Escritório";

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <span
        className={`font-display text-3xl font-semibold tracking-wide md:text-4xl ${wordColor}`}
      >
        {nome}
      </span>
      <span className="mt-2 flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.34em] text-lp-accent">
        <span className={`h-px w-6 ${rule}`} />
        Advocacia
        <span className={`h-px w-6 ${rule}`} />
      </span>
    </div>
  );
}
