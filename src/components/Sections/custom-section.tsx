import {
  extractIframeSrc,
  validateIframeDomain,
} from "@/lib/landing-pages/validation/iframe-extractor";
import type { CustomSection as CustomSectionType } from "@/lib/landing-pages/schema";

/**
 * Seção personalizada criada pelo usuário. Dois formatos — "cards" (grade
 * numerada) e "texto" (bloco de escrita) — cada um em tom claro ou escuro,
 * reaproveitando a mesma linguagem visual das demais seções.
 */
export function CustomSection({ section }: { section: CustomSectionType }) {
  const dark = section.tone === "dark";
  const paras = section.text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const cards = section.cards.filter((c) => c.title.trim() || c.text.trim());

  const isFullWidth =
    section.variant === "fullWidth" &&
    (section.kind === "youtube" ||
      section.kind === "calendar" ||
      section.kind === "maps");

  // Nada preenchido ainda: não renderiza (evita bloco vazio no preview).
  if (!section.title.trim() && !paras.length && !cards.length && !isFullWidth)
    return null;

  return (
    <section
      className={`${isFullWidth ? "py-0" : "py-20 md:py-28"} ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div
        className={isFullWidth ? "w-full" : "mx-auto max-w-7xl px-6 md:px-10"}
      >
        {!isFullWidth && (
          <div className="mx-auto max-w-2xl text-center">
            {section.eyebrow.trim() ? (
              <p
                className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
              >
                {section.eyebrow}
              </p>
            ) : null}
            {section.title.trim() ? (
              <h2
                className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
              >
                {section.title}
              </h2>
            ) : null}
          </div>
        )}

        {section.kind === "texto" ? (
          <div
            className={`mx-auto mt-6 max-w-3xl space-y-4 text-center text-lg leading-relaxed ${
              dark ? "text-white/85" : "text-lp-ink-soft"
            }`}
          >
            {paras.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : section.kind === "youtube" ? (
          <div
            className={
              isFullWidth
                ? "w-full aspect-video"
                : "mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl shadow-xl aspect-video border border-border"
            }
          >
            {section.youtubeId ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${section.youtubeId}`}
                title={section.title || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
                Nenhum vídeo configurado.
              </div>
            )}
          </div>
        ) : section.kind === "calendar" ? (
          (() => {
            // Aceita tanto o src direto quanto o HTML do iframe colado pelo usuário
            const raw = section.calendarUrl ?? "";
            const extracted = extractIframeSrc(raw);
            const src = extracted ?? raw;
            const valid = src ? validateIframeDomain(src, "google.com") : false;
            return (
              <div
                className={
                  isFullWidth
                    ? "w-full"
                    : "mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl shadow-xl border border-border"
                }
                style={{ height: "600px" }}
              >
                {valid ? (
                  <iframe
                    src={src}
                    title={section.title || "Google Calendar"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm px-6 text-center">
                    {src
                      ? "URL inválida. Cole o link de incorporação do Google Calendar."
                      : "Nenhum agendamento configurado."}
                  </div>
                )}
              </div>
            );
          })()
        ) : section.kind === "maps" ? (
          (() => {
            // Aceita tanto o src direto quanto o HTML do iframe colado pelo usuário
            const raw = section.mapsUrl ?? "";
            const extracted = extractIframeSrc(raw);
            const src = extracted ?? raw;
            const valid = src ? validateIframeDomain(src, "google.com") : false;
            return (
              <div
                className={
                  isFullWidth
                    ? "w-full"
                    : "mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl shadow-xl border border-border"
                }
                style={{ height: "450px" }}
              >
                {valid ? (
                  <iframe
                    src={src}
                    title={section.title || "Google Maps"}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="strict-origin-when-cross-origin"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm px-6 text-center">
                    {src
                      ? "URL inválida. Cole o link de incorporação do Google Maps."
                      : "Nenhum mapa configurado."}
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {cards.map((c, i) => (
              <div
                key={i}
                className="flex h-full flex-col rounded-2xl bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lp-brand font-display text-lg font-bold text-lp-accent-soft">
                  {i + 1}
                </span>
                <h3 className="font-display text-2xl font-bold text-lp-brand">
                  {c.title}
                </h3>
                <p className="mt-2 text-[1.05rem] leading-relaxed text-lp-ink-soft">
                  {c.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
