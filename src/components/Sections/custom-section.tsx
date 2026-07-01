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

  // Nada preenchido ainda: não renderiza (evita bloco vazio no preview).
  if (!section.title.trim() && !paras.length && !cards.length) return null;

  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-lp-cream"}`}
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
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
