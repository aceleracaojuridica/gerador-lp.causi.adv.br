"use client";

import { ProgressActivity, WandStars } from "@material-symbols-svg/react";
import { useState } from "react";

/**
 * Botão "Melhorar texto" — manda o texto pro /api/melhorar-texto (OpenAI), que
 * corrige o português e aprimora a redação mantendo os fatos (sobriedade OAB),
 * e devolve o resultado via onResult. Reutilizável no cadastro e no editor.
 */
export function MelhorarTextoButton({
  text,
  kind,
  office,
  onResult,
  className = "",
  iconOnly = false,
}: {
  text: string;
  kind: "sobre" | "diferencial";
  office?: { name?: string; product?: string };
  onResult: (texto: string) => void;
  className?: string;
  iconOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(false);
  const vazio = !text.trim();

  async function melhorar() {
    if (vazio || loading) return;
    setLoading(true);
    setErro(false);
    try {
      const res = await fetch("/api/melhorar-texto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, kind, office }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        texto?: string;
        error?: string;
      };
      if (!res.ok || !data.texto) throw new Error(data.error || "falha");
      onResult(data.texto);
    } catch (e) {
      console.error(e);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={melhorar}
        disabled={vazio || loading}
        title={
          vazio
            ? "Escreva algo primeiro"
            : erro
              ? "Tentar de novo"
              : "Melhorar texto com IA"
        }
        className={`inline-flex items-center justify-center rounded-md p-1 text-ui transition hover:bg-ui-soft disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        {loading ? (
          <ProgressActivity size={16} className="animate-spin" />
        ) : (
          <WandStars size={16} />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={melhorar}
      disabled={vazio || loading}
      title={vazio ? "Escreva algo primeiro" : "Corrigir e aprimorar com IA"}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-ui/30 bg-ui-soft px-2.5 py-1.5 text-xs font-semibold text-ui transition hover:bg-ui-soft/70 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {loading ? (
        <ProgressActivity size={14} className="animate-spin" />
      ) : (
        <WandStars size={14} />
      )}
      {loading ? "Melhorando…" : erro ? "Tentar de novo" : "Melhorar texto"}
    </button>
  );
}
