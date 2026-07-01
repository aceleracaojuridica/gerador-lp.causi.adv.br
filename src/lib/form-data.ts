export function toStr(value: FormDataEntryValue | null): string | null {
  const s = typeof value === "string" ? value.trim() : null;
  return s || null;
}

export function toRawString(
  value: FormDataEntryValue | null,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export function toOptionalNumber(
  value: FormDataEntryValue | null,
): number | null {
  const s = toStr(value);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function parseJson<T>(value: FormDataEntryValue | null): T | null {
  const s = toStr(value);
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export function getFirstIssueMessage(
  issues: Array<{ message?: string }> | undefined,
  fallback: string,
): string {
  return issues?.[0]?.message ?? fallback;
}
