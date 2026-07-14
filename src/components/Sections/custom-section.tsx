import { PlayArrowFill } from "@material-symbols-svg/react";
import { CTAButton } from "@/components/ui/cta-button";
import type { CustomSection as CustomSectionType } from "@/lib/landing-pages/schema";
import {
  extractIframeSrc,
  validateIframeDomain,
} from "@/lib/landing-pages/validation/iframe-extractor";

/**
 * Player do YouTube da seção de vídeo.
 *
 * A prévia do editor roda dentro de um iframe `about:blank` (ver DevicePreview):
 * sem URL própria, o embed não manda origem/referrer válidos e o YouTube recusa
 * com o "Erro 153 — erro de configuração do player". Por isso ali mostramos a
 * thumbnail do vídeo (clicável, abre no YouTube); o player de verdade só entra
 * na LP publicada, que tem uma URL real.
 */
function YouTubeFrame({
  youtubeId,
  title,
  demo,
}: {
  youtubeId: string;
  title: string;
  demo: boolean;
}) {
  if (!youtubeId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm">
        Nenhum vídeo configurado.
      </div>
    );
  }

  if (demo) {
    return (
      <a
        href={`https://www.youtube.com/watch?v=${youtubeId}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Assistir ao vídeo no YouTube"
        className="group relative flex h-full w-full items-center justify-center bg-lp-brand-dark"
        style={{
          backgroundImage: `url('https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-lp-accent text-lp-brand-dark shadow-xl transition group-hover:scale-110">
          <PlayArrowFill size={26} className="ml-1" />
        </span>
      </a>
    );
  }

  return (
    <iframe
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${youtubeId}`}
      title={title || "YouTube video player"}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
    />
  );
}

/**
 * Seção personalizada criada pelo usuário. Dois formatos — "cards" (grade
 * numerada) e "texto" (bloco de escrita) — cada um em tom claro ou escuro,
 * reaproveitando a mesma linguagem visual das demais seções.
 */
export function CustomSection({
  section,
  demo = false,
}: {
  section: CustomSectionType;
  /** true no editor/preview interno; false na LP publicada. */
  demo?: boolean;
}) {
  const dark = section.tone === "dark";
  const paras = section.text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const cards = section.cards.filter((c) => c.title.trim() || c.text.trim());
  const cta = section.cta?.trim() ?? "";

  const isFullWidth =
    section.variant === "fullWidth" &&
    (section.kind === "youtube" ||
      section.kind === "calendar" ||
      section.kind === "maps");

  // Seções de mídia valem por si: um vídeo/mapa/agenda sem título ainda precisa
  // aparecer, então a mídia conta como conteúdo para o guard de "bloco vazio".
  const hasEmbed = Boolean(
    section.youtubeId?.trim() ||
      section.calendarUrl?.trim() ||
      section.mapsUrl?.trim(),
  );

  // Nada preenchido ainda: não renderiza (evita bloco vazio no preview).
  if (
    !section.title.trim() &&
    !paras.length &&
    !cards.length &&
    !hasEmbed &&
    !cta &&
    !isFullWidth
  )
    return null;

  return (
    <section
      className={`${isFullWidth ? "py-0" : "py-20 md:py-28"} ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div
        className={isFullWidth ? "w-full" : "mx-auto max-w-7xl px-6 md:px-10"}
      >
        {!isFullWidth && (
          <div className="mx-auto max-w-2xl break-words text-center">
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
            className={`mx-auto mt-6 max-w-3xl space-y-4 break-words text-center text-lg leading-relaxed ${
              dark ? "text-white/85" : "text-lp-ink-soft"
            }`}
          >
            {paras.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        ) : section.kind === "youtube" ? (
          <>
            {!isFullWidth && paras.length ? (
              <div
                className={`mx-auto mt-6 max-w-3xl space-y-4 break-words text-center text-lg leading-relaxed ${
                  dark ? "text-white/85" : "text-lp-ink-soft"
                }`}
              >
                {paras.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            ) : null}
            <div
              className={
                isFullWidth
                  ? "w-full aspect-video"
                  : "mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl shadow-xl aspect-video border border-border"
              }
            >
              <YouTubeFrame
                youtubeId={section.youtubeId?.trim() ?? ""}
                title={section.title}
                demo={demo}
              />
            </div>
          </>
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
            {cards.map((c, index) => (
              <div
                key={`${c.title}::${c.text}`}
                className="flex h-full flex-col break-words rounded-2xl bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <span className="mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lp-brand font-display text-lg font-bold text-lp-accent-soft">
                  {index + 1}
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

        {/* Botão da seção — vale para todos os formatos. Vazio não renderiza.
            No modo faixa cheia a seção é só a mídia (sem título nem texto),
            então o botão também fica de fora. */}
        {!isFullWidth && cta ? (
          <div className="mt-10 flex justify-center">
            <CTAButton variant={dark ? "primary" : "accent"}>{cta}</CTAButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
