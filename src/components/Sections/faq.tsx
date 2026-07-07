"use client";

import { KeyboardArrowDown } from "@material-symbols-svg/react";
import { useState } from "react";
import { Reveal } from "@/components/ui/reveal";
import type { FaqContent, Tone } from "@/lib/landing-pages/schema";
import { HeadlineText } from "./headline-text";

// FAQ sempre em acordeão (abre/fecha). Tom claro ou escuro conforme o toggle.
export function FAQ({ content, tone }: { content: FaqContent; tone: Tone }) {
  if (content.items.length === 0) return null;
  const dark = tone === "dark";
  return (
    <section
      className={`py-20 md:py-28 ${dark ? "bg-lp-brand-dark" : "bg-white"}`}
    >
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <Reveal className="text-center">
          <p
            className={`eyebrow mb-3 ${dark ? "text-lp-accent-soft" : "text-lp-accent"}`}
          >
            {content.eyebrow}
          </p>
          <h2
            className={`section-title ${dark ? "text-white" : "text-lp-brand"}`}
          >
            <HeadlineText
              h={content.headline}
              accentVar={dark ? "accent-soft" : "accent"}
            />
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {content.items.map((item, i) => (
            <FaqAccordion
              key={item.q}
              item={item}
              defaultOpen={i === 0}
              dark={dark}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqAccordion({
  item,
  defaultOpen,
  dark,
}: {
  item: { q: string; a: string };
  defaultOpen: boolean;
  dark: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  // Estilo condicional para item aberto (brand bg no modo claro)
  const itemBg = open
    ? dark
      ? "bg-white/[0.1] ring-1 ring-lp-accent"
      : "bg-lp-brand text-white shadow-md"
    : dark
      ? "bg-white/[0.06] ring-1 ring-white/10"
      : "bg-lp-cream text-lp-brand";

  const questionColor = open
    ? dark
      ? "text-white"
      : "text-white"
    : dark
      ? "text-white"
      : "text-lp-brand";

  const answerColor = open
    ? dark
      ? "text-white/80"
      : "text-white/85"
    : dark
      ? "text-white/75"
      : "text-lp-ink-soft";

  const chevronColor = open
    ? dark
      ? "text-lp-accent-soft"
      : "text-lp-accent-soft"
    : dark
      ? "text-lp-accent-soft"
      : "text-lp-accent";

  return (
    <div
      className={`overflow-hidden rounded-xl transition-all duration-200 ${itemBg}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span
          className={`font-display text-lg font-semibold leading-snug ${questionColor}`}
        >
          {item.q}
        </span>
        <KeyboardArrowDown
          size={20}
          className={`shrink-0 transition-transform ${chevronColor} ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <p className={`px-6 pb-6 leading-relaxed ${answerColor}`}>{item.a}</p>
      ) : null}
    </div>
  );
}
