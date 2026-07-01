import { AGENT_OFFICE_HOURS_TIME_OPTIONS } from "@/lib/constants/agents";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Horários de início válidos dado o fim selecionado. */
export function filterOfficeHoursStartOptions(
  endValue: string,
  options: readonly string[] = AGENT_OFFICE_HOURS_TIME_OPTIONS,
): string[] {
  if (!endValue) return [...options];
  const endMin = timeToMinutes(endValue);
  return options.filter((t) => timeToMinutes(t) < endMin);
}

/** Horários de fim válidos dado o início selecionado. */
export function filterOfficeHoursEndOptions(
  startValue: string,
  options: readonly string[] = AGENT_OFFICE_HOURS_TIME_OPTIONS,
): string[] {
  if (!startValue) return [...options];
  const startMin = timeToMinutes(startValue);
  return options.filter((t) => timeToMinutes(t) > startMin);
}
