"use client";

import { ArrowForward } from "@material-symbols-svg/react/rounded";
import type { ReactNode } from "react";
import { useCtaConfig } from "./cta-config";

type Variant = "primary" | "accent" | "white" | "ghost" | "outline";

const styles: Record<Variant, string> = {
  // Em fundo escuro/da marca: accent sólido. Texto contrasta com o accent
  // (branco se accent escuro, ex.: azul; escuro se accent claro, ex.: dourado).
  primary:
    "bg-accent text-[var(--color-accent-ink)] shadow-lg shadow-black/15 hover:bg-accent-soft hover:-translate-y-0.5",
  // Em fundo claro: navy sólido.
  accent:
    "bg-brand text-white shadow-md shadow-brand/20 hover:bg-brand-dark hover:-translate-y-0.5",
  // Em fundo escuro: branco, contraste máximo.
  white: "bg-white text-brand shadow-lg shadow-black/15 hover:-translate-y-0.5",
  // Secundário em fundo escuro, sempre ao lado de um primary.
  ghost:
    "border-2 border-white/40 text-white hover:border-white hover:bg-white/10",
  // Secundário em fundo claro, ao lado de um accent.
  outline:
    "border-2 border-brand/25 text-brand hover:border-brand hover:bg-brand/5",
};

// No preview do builder o CTA é apenas ilustrativo: sem popup de lead.
// onClick é opcional e por padrão não faz nada (a LP real liga ao fluxo de lead).
export function CTAButton({
  children,
  variant = "accent",
  withArrow = true,
  onClick,
}: {
  children: ReactNode;
  variant?: Variant;
  withArrow?: boolean;
  onClick?: () => void;
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
