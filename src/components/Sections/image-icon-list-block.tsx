import { Reveal } from "@/components/ui/reveal";
import type { Headline } from "@/lib/landing-pages/schema";
import { HeadlineText } from "./headline-text";
import { IconForKey } from "./icon-for-key";

export type ImageIconListItem = {
  icon: string;
  title: string;
  text: string;
  key: string;
};

type ImageIconListBlockProps = {
  eyebrow: string;
  headline: Headline;
  intro: string;
  items: ImageIconListItem[];
  image: string;
  dark: boolean;
};

/* Layout reutilizável: imagem à esquerda; à direita eyebrow, título e texto
   curto, um separador e os itens em 2 colunas — ícone circular + titulinho +
   frase. Sem botão. Usado nas seções Dor e Solução. */
export function ImageIconListBlock({
  eyebrow,
  headline,
  intro,
  items,
  image,
  dark,
}: ImageIconListBlockProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className="h-full">
        <div
          className="relative h-full min-h-[22rem] overflow-hidden rounded-2xl bg-lp-brand lg:min-h-[30rem]"
          style={
            image
              ? {
                  backgroundImage: `url('${image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />
      </Reveal>

      <Reveal delay={120}>
        <div>
          {/* O traço decorativo agora vem da classe .eyebrow (lp-theme.css) —
              antes era montado aqui à mão, e só esta variante o tinha. */}
          <p
            className={`eyebrow mb-4 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {eyebrow}
          </p>

          <h2
            className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
          >
            <HeadlineText
              h={headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h2>
          <p
            className={`mt-5 text-lg leading-relaxed ${dark ? "text-white/80" : "text-lp-ink-soft"}`}
          >
            {intro}
          </p>

          {/* Separador entre o texto e os itens */}
          <div
            className={`mt-8 h-px w-16 ${dark ? "bg-white/25" : "bg-lp-ink-soft/25"}`}
          />

          <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
            {items.map((it) => (
              <li key={it.key} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border ${
                    dark
                      ? "border-white/25 text-lp-accent-soft"
                      : "border-lp-ink-soft/25 text-lp-accent"
                  }`}
                >
                  <IconForKey iconKey={it.icon} size={16} />
                </span>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold leading-snug ${dark ? "text-white" : "text-lp-brand"}`}
                  >
                    {it.title}
                  </p>
                  <p
                    className={`mt-0.5 text-sm leading-snug ${dark ? "text-white/70" : "text-lp-ink-soft"}`}
                  >
                    {it.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}
