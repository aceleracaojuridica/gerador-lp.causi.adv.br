export function formatDateTime(value: string | Date): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatMessageDate(value: string | Date): string {
  if (!value) return "";

  const d = value instanceof Date ? value : new Date(value);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return "Ontem";

  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Moedas suportadas na formatação de valores. */
export type CurrencyCode = "BRL" | "USD" | "EUR";

/** @todo Substituir por moeda da conta quando disponível no client. */
export const DEFAULT_CURRENCY: CurrencyCode = "BRL";

const CURRENCY_LOCALE_MAP: Record<CurrencyCode, string> = {
  BRL: "pt-BR",
  USD: "en-US",
  EUR: "de-DE",
};

function getCurrencyLocale(currency: CurrencyCode): string {
  return CURRENCY_LOCALE_MAP[currency];
}

/** Valor com símbolo de moeda (ex.: totais compactos no Kanban). */
export function formatCurrency(value: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Valor decimal para input (ex.: 1.000.000,00) — sem símbolo de moeda. */
export function formatDecimalCurrency(
  value: number | undefined,
  currency: CurrencyCode,
): string {
  if (value == null || Number.isNaN(value)) {
    return "";
  }
  return new Intl.NumberFormat(getCurrencyLocale(currency), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Converte texto digitado (máscara centavos) em número. */
export function parseDecimalCurrencyInput(input: string): number | undefined {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return undefined;
  }
  return Number.parseInt(digits, 10) / 100;
}
