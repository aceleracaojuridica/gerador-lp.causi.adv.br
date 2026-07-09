import type { Office } from "@/lib/landing-pages/schema";
import {
  createPopupQuestion,
  newPopupQuestionId,
  type PopupQuestion,
  type PopupQuestionType,
} from "./types";

const POPUP_TYPES = new Set<PopupQuestionType>([
  "text",
  "number",
  "phone",
  "email",
  "url",
  "currency",
  "choice",
  "cep",
]);

type LegacyPopupEmail = { enabled: boolean; required: boolean };

type LegacyPopup = {
  questions?: unknown[];
  email?: LegacyPopupEmail;
};

/** Converte pergunta salva (inclui legado com options em text) para o modelo atual. */
export function parseLegacyPopupQuestion(raw: unknown): PopupQuestion {
  if (!raw || typeof raw !== "object") {
    return createPopupQuestion("text");
  }

  const q = raw as Record<string, unknown>;
  const id = String(q.id ?? newPopupQuestionId());
  const label = String(q.label ?? "");
  const required = q.required !== false;
  const type = POPUP_TYPES.has(q.type as PopupQuestionType)
    ? (q.type as PopupQuestionType)
    : "text";

  if (type === "choice") {
    return createPopupQuestion("choice", {
      id,
      label,
      required,
      options: Array.isArray(q.options) ? q.options.map(String) : [""],
      allowMultiple: !!q.allowMultiple,
    });
  }

  if (type === "currency") {
    const currency =
      q.currency === "USD" || q.currency === "EUR" ? q.currency : "BRL";
    return createPopupQuestion("currency", { id, label, required, currency });
  }

  return createPopupQuestion(type, { id, label, required });
}

function hasEmailQuestion(questions: PopupQuestion[]): boolean {
  return questions.some(
    (q) => q.type === "email" || /e-?mail/i.test(q.label.trim()),
  );
}

/** Migra popup.email legado para pergunta customizada e remove o campo obsoleto. */
export function normalizePopupConfig(
  popup: LegacyPopup | undefined,
): { questions: PopupQuestion[] } | undefined {
  if (!popup) return undefined;

  const questions = (popup.questions ?? []).map(parseLegacyPopupQuestion);

  if (popup.email?.enabled && !hasEmailQuestion(questions)) {
    questions.push(
      createPopupQuestion("email", {
        id: `migrated-email-${newPopupQuestionId()}`,
        label: "E-mail",
        required: popup.email.required,
      }),
    );
  }

  return { questions };
}

/** Normaliza buttons.popup ao carregar LP no editor ou na captura. */
export function normalizeOfficeButtons(
  buttons: Office["buttons"],
): Office["buttons"] {
  if (!buttons?.popup) return buttons;
  return {
    ...buttons,
    popup: normalizePopupConfig(buttons.popup as LegacyPopup),
  };
}
