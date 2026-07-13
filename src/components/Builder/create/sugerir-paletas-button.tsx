"use client";

import { ProgressActivity, WandStars } from "@material-symbols-svg/react";
import { useState, useTransition } from "react";
import { suggestSimilarPaletteAction } from "@/app/actions/palettes";
import type { Theme } from "@/lib/landing-pages/schema";

type Props = {
  /** Cores base (extraídas da logo) — a IA parte daqui. */
  baseTheme: Theme;
  /** Theme atual (enviado como avoid para gerar variação). */
  value: Theme;
  onPick: (theme: Theme) => void;
  className?: string;
};

/**
 * Varinha: cada clique gera e aplica 1 paleta semelhante à extraída da logo.
 */
export function SugerirPaletasButton({
  baseTheme,
  value,
  onPick,
  className = "",
}: Props) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState(false);

  function sugerir() {
    if (pending) return;
    setErro(false);
    startTransition(async () => {
      const result = await suggestSimilarPaletteAction(baseTheme, value);
      if (!result.ok) {
        console.error(result.error);
        setErro(true);
        return;
      }
      onPick(result.theme);
    });
  }

  return (
    <button
      type="button"
      onClick={sugerir}
      disabled={pending}
      title={erro ? "Tentar de novo" : "Gerar paleta semelhante com IA"}
      className={`inline-flex items-center justify-center rounded-md p-1 text-ui transition hover:bg-ui-soft disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {pending ? (
        <ProgressActivity size={16} className="animate-spin" />
      ) : (
        <WandStars size={16} />
      )}
    </button>
  );
}
