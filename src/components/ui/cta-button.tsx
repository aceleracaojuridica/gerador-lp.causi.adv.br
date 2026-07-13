"use client";

import { ArrowForward } from "@material-symbols-svg/react/rounded";
import type { ReactNode } from "react";
import { useCtaConfig } from "./cta-config";

type Variant = "primary" | "accent" | "white" | "ghost" | "outline";

const styles: Record<Variant, string> = {
  // Em fundo escuro/da marca: accent sólido. Texto contrasta com o accent
  // (branco se accent escuro, ex.: azul; escuro se accent claro, ex.: dourado).
  primary:
    "bg-lp-accent text-[var(--color-lp-accent-ink)] shadow-lg shadow-black/15 hover:bg-lp-accent-soft hover:-translate-y-0.5",
  // Em fundo claro: navy sólido.
  accent:
    "bg-lp-brand text-white shadow-md shadow-lp-brand/20 hover:bg-lp-brand-dark hover:-translate-y-0.5",
  // Em fundo escuro: branco, contraste máximo.
  white:
    "bg-white text-lp-brand shadow-lg shadow-black/15 hover:-translate-y-0.5",
  // Secundário em fundo escuro, sempre ao lado de um primary.
  ghost:
    "border-2 border-white/40 text-white hover:border-white hover:bg-white/10",
  // Secundário em fundo claro, ao lado de um accent.
  outline:
    "border-2 border-lp-brand/25 text-lp-brand hover:border-lp-brand hover:bg-lp-brand/5",
};

// No preview do builder o CTA é apenas ilustrativo: sem popup de lead.
// onClick é opcional e por padrão não faz nada (a LP real liga ao fluxo de lead).
export function CTAButton({
  children,
  variant = "accent",
  withArrow = true,
  onClick,
  anchor,
}: {
  children: ReactNode;
  variant?: Variant;
  withArrow?: boolean;
  onClick?: () => void;
  // Âncora interna (ex.: "#sec-areas"): rola suavemente até a seção, ignorando
  // a ação de lead. Usada no 2º botão do Hero.
  anchor?: string;
}) {
  const { href, square, onCtaClick } = useCtaConfig();
  const cls = `group inline-flex items-center gap-2.5 ${
    square ? "rounded-[5px]" : "rounded-full"
  } px-7 py-3.5 text-base font-semibold transition ${styles[variant]}`;
  const inner = (
    <>
      {children}
      {withArrow && (
        <ArrowForward
          size={18}
          className="transition-transform group-hover:translate-x-1"
          aria-hidden
        />
      )}
    </>
  );
  // Âncora interna tem prioridade sobre a ação de lead: rola até a seção.
  if (anchor) {
    return (
      <a
        href={anchor}
        className={cls}
        onClick={(e) => {
          const el = document.getElementById(anchor.replace(/^#/, ""));
          if (el) {
            e.preventDefault();
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        {inner}
      </a>
    );
  }
  // Popup: abre o formulário de lead. Link/WhatsApp: vira <a>. Senão: inerte.
  if (onCtaClick) {
    return (
      <button type="button" onClick={onCtaClick} className={cls}>
        {inner}
      </button>
    );
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
