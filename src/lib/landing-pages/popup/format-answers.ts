import type { PopupQuestion } from "./types";
import { formatCepAnswerDisplay } from "./viacep";

/** Formata valor bruto de uma resposta para exibição legível. */
export function formatAnswerForDisplay(q: PopupQuestion, raw: string): string {
  const v = raw.trim();
  if (!v) return v;

  if (q.type === "cep") {
    return formatCepAnswerDisplay(v);
  }

  return v;
}
