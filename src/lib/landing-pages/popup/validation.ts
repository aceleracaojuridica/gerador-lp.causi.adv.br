import { z } from "zod";
import {
  isValidCep,
  unmaskNumeric,
} from "@/lib/validators/brazilian-documents";
import { parseDecimalCurrencyInput } from "@/lib/formatters";
import type { PopupQuestion } from "./types";

export function isQuestionRequired(q: PopupQuestion): boolean {
  return q.required !== false;
}

const CHOICE_SEPARATOR = "; ";

/** Separa valores de multi-escolha. */
export function parseChoiceValues(value: string): string[] {
  return value
    .split(CHOICE_SEPARATOR)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Junta opções selecionadas para armazenamento. */
export function joinChoiceValues(values: string[]): string {
  return values.join(CHOICE_SEPARATOR);
}

/**
 * Valida resposta de uma pergunta do popup.
 * Retorna mensagem de erro ou null se válido.
 */
export function validatePopupAnswer(
  q: PopupQuestion,
  value: string,
): string | null {
  const trimmed = value.trim();
  const required = isQuestionRequired(q);

  if (!trimmed) {
    return required ? "Preencha este campo." : null;
  }

  switch (q.type) {
    case "email": {
      if (!z.string().email().safeParse(trimmed).success) {
        return "E-mail inválido.";
      }
      break;
    }
    case "url": {
      if (!trimmed.toLowerCase().startsWith("https://")) {
        return "O link deve começar com https://";
      }
      break;
    }
    case "phone": {
      if (unmaskNumeric(trimmed).length < 10) {
        return "Telefone inválido.";
      }
      break;
    }
    case "number": {
      const n = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(n)) return "Número inválido.";
      break;
    }
    case "currency": {
      if (parseDecimalCurrencyInput(trimmed) === undefined) {
        return "Valor inválido.";
      }
      break;
    }
    case "cep": {
      try {
        const data = JSON.parse(trimmed) as { cep?: string };
        if (!data.cep || !isValidCep(data.cep)) return "CEP inválido.";
      } catch {
        if (!isValidCep(trimmed)) return "CEP inválido.";
      }
      break;
    }
    case "choice": {
      if (parseChoiceValues(trimmed).length === 0) {
        return required ? "Selecione uma opção." : null;
      }
      break;
    }
    default:
      break;
  }

  return null;
}
