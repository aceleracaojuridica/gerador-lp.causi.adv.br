"use client";

import { Check, KeyboardArrowDown } from "@material-symbols-svg/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { matchPalette, PALETTES } from "@/lib/landing-pages/palettes";
import type { Theme } from "@/lib/landing-pages/schema";

type Props = {
  value: Theme;
  onPick: (t: Theme) => void;
  className?: string;
  // Quando `open` é fornecido, o componente é CONTROLADO: não renderiza o próprio
  // cabeçalho "Paleta · Trocar" (quem controla mostra o botão onde quiser) e só
  // exibe a grade. Sem `open`, gerencia o próprio estado (com cabeçalho).
  open?: boolean;
};

/**
 * Seletor de paletas pré-prontas. Alternativa confiável à extração da logo:
 * clicar aplica o Theme inteiro. Destaca a paleta ativa (casada por brand+accent).
 *
 * Fica RECOLHIDO por padrão: a grade só aparece se o usuário clicar para
 * trocar a paleta — assim as cores extraídas da logo permanecem como estão
 * a menos que ele realmente queira mudar.
 */
export function PalettePicker({
  value,
  onPick,
  className,
  open: openProp,
}: Props) {
  const activeId = matchPalette(value);
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const activeName = PALETTES.find((p) => p.id === activeId)?.name;
  return (
    <div className={className}>
      {!controlled ? (
        <button
          type="button"
          onClick={() => setInternalOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 text-left"
          aria-expanded={open}
        >
          <span className="text-sm font-medium text-slate-700">
            {activeName ? `Paleta: ${activeName}` : "Escolher uma paleta"}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-ui-hover">
            {open ? "Fechar" : "Trocar"}
            <KeyboardArrowDown
              size={14}
              className={`transition-transform ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      ) : null}
      {open ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PALETTES.map((p) => {
            const active = p.id === activeId;
            return (
              <Button
                key={p.id}
                type="button"
                variant={active ? "outline" : "ghost"}
                onClick={() => onPick(p.theme)}
                className={`h-auto justify-start gap-2 border-2 px-2.5 py-2 ${
                  active
                    ? "border-ui"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className="flex shrink-0 gap-0.5">
                  {[
                    p.theme.brand,
                    p.theme.accent,
                    p.theme.accentSoft,
                    p.theme.cream,
                  ].map((c) => (
                    <span
                      key={c}
                      className="h-4 w-2.5 rounded-sm border border-black/5"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                  {p.name}
                </span>
                {active ? (
                  <Check size={13} className="shrink-0 text-ui" />
                ) : null}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
