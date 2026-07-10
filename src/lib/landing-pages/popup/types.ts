/** Moedas suportadas em perguntas do tipo currency. */
export type PopupCurrency = "BRL" | "USD" | "EUR";

export type PopupQuestionType =
  | "text"
  | "number"
  | "phone"
  | "email"
  | "url"
  | "currency"
  | "choice"
  | "cep";

export type PopupQuestionBase = {
  id: string;
  label: string;
  /** Default: obrigatório quando ausente. */
  required?: boolean;
};

export type PopupQuestion =
  | (PopupQuestionBase & { type: "text" })
  | (PopupQuestionBase & { type: "number" })
  | (PopupQuestionBase & { type: "phone" })
  | (PopupQuestionBase & { type: "email" })
  | (PopupQuestionBase & { type: "url" })
  | (PopupQuestionBase & {
      type: "currency";
      currency: PopupCurrency;
    })
  | (PopupQuestionBase & {
      type: "choice";
      options: string[];
      allowMultiple?: boolean;
    })
  | (PopupQuestionBase & { type: "cep" });

export const POPUP_QUESTION_TYPE_LABELS: Record<PopupQuestionType, string> = {
  text: "Texto livre",
  number: "Número",
  phone: "Telefone",
  email: "E-mail",
  url: "URL (https)",
  currency: "Valor monetário",
  choice: "Múltipla escolha",
  cep: "CEP (cidade/UF)",
};

export function newPopupQuestionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `q-${Math.random().toString(36).slice(2)}`;
}

/** Cria pergunta com campos padrão por tipo. */
export function createPopupQuestion(
  type: PopupQuestionType,
  partial?: Partial<PopupQuestion> & { id?: string; label?: string },
): PopupQuestion {
  const id = partial?.id ?? newPopupQuestionId();
  const label = partial?.label ?? "";
  const required = partial?.required !== false;

  const base = { id, label, required };

  switch (type) {
    case "choice":
      return {
        ...base,
        type: "choice",
        options:
          partial && "options" in partial && Array.isArray(partial.options)
            ? partial.options
            : [""],
        allowMultiple:
          partial && "allowMultiple" in partial
            ? !!partial.allowMultiple
            : false,
      };
    case "currency":
      return {
        ...base,
        type: "currency",
        currency:
          partial && "currency" in partial && partial.currency
            ? partial.currency
            : "BRL",
      };
    default:
      return { ...base, type };
  }
}
