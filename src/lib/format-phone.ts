import { parsePhoneNumber } from "react-phone-number-input";

/**
 * Formata telefone para exibição na UI.
 * Brasil: +DDI (DDD) 9 99999-9999 (celular) ou +DDI (DDD) 9999-9999 (fixo).
 * Demais países: formato internacional padrão.
 */
export function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  const parsed = parsePhoneNumber(`+${digits}`);
  if (!parsed) return raw;

  if (parsed.country !== "BR") {
    return parsed.formatInternational();
  }

  const national = parsed.nationalNumber;
  if (national.length < 10) return raw;

  const areaCode = national.slice(0, 2);
  const subscriber = national.slice(2);

  if (subscriber.length === 9) {
    return `+${parsed.countryCallingCode} (${areaCode}) ${subscriber[0]} ${subscriber.slice(1, 5)}-${subscriber.slice(5)}`;
  }

  if (subscriber.length === 8) {
    return `+${parsed.countryCallingCode} (${areaCode}) ${subscriber.slice(0, 4)}-${subscriber.slice(4)}`;
  }

  return parsed.formatInternational();
}

/**
 * Formata telefone para exibição ou retorna fallback quando vazio/ausente.
 */
export function formatPhoneDisplayOrFallback(
  raw: string | null | undefined,
  fallback: string,
): string {
  if (!raw?.trim()) return fallback;
  return formatPhoneDisplay(raw);
}
