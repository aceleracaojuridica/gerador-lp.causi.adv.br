import { Reveal } from "@/components/ui/reveal";
import type { Headline } from "@/lib/landing-pages/schema";
import { HeadlineText } from "./headline-text";

export type ImageListItem = { title: string; key: string };

type ImageListBlockProps = {
  eyebrow: string;
  headline: Headline;
  intro: string;
  items: ImageListItem[];
  image: string;
  dark: boolean;
};

/* Layout reutilizável: header + itens em lista enxuta (bullets, 2 colunas, sem
   ícones) à esquerda, imagem enquadrada e alinhada verticalmente à direita.
   Usado nas seções Dor e Solução. */
export function ImageListBlock({
  eyebrow,
  headline,
  intro,
  items,
  image,
  dark,
}: ImageListBlockProps) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal>
        <div>
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
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
          <ul className="mt-9 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
            {items.map((it) => (
              <li
                key={it.key}
                className={`flex items-start gap-3 border-b py-4 ${
                  dark ? "border-white/12" : "border-lp-ink-soft/15"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full ${
                    dark ? "bg-lp-accent-soft" : "bg-lp-accent"
                  }`}
                />
                <span
                  className={`text-[1.05rem] font-medium leading-snug ${
                    dark ? "text-white/90" : "text-lp-brand"
                  }`}
                >
                  {it.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal delay={120} className="h-full">
        <div
          className="relative h-full min-h-[20rem] overflow-hidden rounded-2xl bg-lp-brand"
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
    </div>
  );
}
