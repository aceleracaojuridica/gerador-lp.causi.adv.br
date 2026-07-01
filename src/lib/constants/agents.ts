// Constantes do módulo de agentes (qualificação, follow-up e agendamento).
// Arquivo único e propositalmente explícito: preferimos valores literais a
// abstrações/derivações que dificultam a leitura.

// ─────────────────────────────────────────────────────────────────────────
// Follow-up
// ─────────────────────────────────────────────────────────────────────────

export const AGENT_DEFAULT_FOLLOW_UP_LIMIT = 5;
export const AGENT_DEFAULT_FOLLOW_UP_INTERVAL_MINUTES = 5 * 60;

// ─────────────────────────────────────────────────────────────────────────
// Horário comercial — 08:00 às 18:00
// Mesma janela usada como padrão e como recomendada, no follow-up e no
// agendamento.
// ─────────────────────────────────────────────────────────────────────────

export const AGENT_OFFICE_HOURS_START = "08:00";
export const AGENT_OFFICE_HOURS_END = "18:00";

// Mesmos limites em minutos desde a meia-noite, usados pela validação do schema.
export const AGENT_OFFICE_HOURS_MINUTES_START = 8 * 60;
export const AGENT_OFFICE_HOURS_MINUTES_END = 18 * 60;

// Opções de horário exibidas nos selects (08:00 a 18:00, de 30 em 30 min).
export const AGENT_OFFICE_HOURS_TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
] as const;

export const AGENT_OFFICE_HOURS_TIME_SET = new Set<string>(
  AGENT_OFFICE_HOURS_TIME_OPTIONS,
);

// ─────────────────────────────────────────────────────────────────────────
// Dias da semana
// ─────────────────────────────────────────────────────────────────────────

// Opções (valor + rótulos) para o seletor de dias da semana.
// O `value` é a chave usada no formulário (string PT-BR sem acento).
// `isoWeekday` é o número correspondente (1 = segunda, 7 = domingo) usado
// na persistência e em libs de tempo (luxon/moment) consumidas pelo n8n.
export const AGENT_WEEK_DAY_OPTIONS = [
  { value: "domingo", label: "Dom", ariaLabel: "Domingo", isoWeekday: 7 },
  { value: "segunda", label: "Seg", ariaLabel: "Segunda", isoWeekday: 1 },
  { value: "terca", label: "Ter", ariaLabel: "Terça", isoWeekday: 2 },
  { value: "quarta", label: "Qua", ariaLabel: "Quarta", isoWeekday: 3 },
  { value: "quinta", label: "Qui", ariaLabel: "Quinta", isoWeekday: 4 },
  { value: "sexta", label: "Sex", ariaLabel: "Sexta", isoWeekday: 5 },
  { value: "sabado", label: "Sáb", ariaLabel: "Sábado", isoWeekday: 6 },
] as const;

export type AgentWeekDayValue =
  (typeof AGENT_WEEK_DAY_OPTIONS)[number]["value"];
export type AgentWeekDayIso =
  (typeof AGENT_WEEK_DAY_OPTIONS)[number]["isoWeekday"];

// Dias pré-selecionados em novos agentes: segunda a sexta.
// Usado como valor inicial do toggle no formulário (strings PT-BR).
export const AGENT_DEFAULT_WEEK_DAYS: AgentWeekDayValue[] = [
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
];

// Mesmo intervalo em ISO weekday — usado como DEFAULT das colunas
// office_week_days e scheduling_week_days (smallint[]) no banco.
export const AGENT_DEFAULT_WEEK_DAYS_ISO: AgentWeekDayIso[] = [1, 2, 3, 4, 5];

/** Converte string PT-BR do form em ISO weekday (1..7). Retorna null se inválido. */
export function weekDayToIso(value: string): AgentWeekDayIso | null {
  return (
    AGENT_WEEK_DAY_OPTIONS.find((day) => day.value === value)?.isoWeekday ??
    null
  );
}

/** Converte ISO weekday (1..7) em string PT-BR do form. Retorna null se inválido. */
export function isoToWeekDay(iso: number): AgentWeekDayValue | null {
  return (
    AGENT_WEEK_DAY_OPTIONS.find((day) => day.isoWeekday === iso)?.value ?? null
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Agendamento — UI (links, e-mail do webmaster, placeholders, GIF)
// ─────────────────────────────────────────────────────────────────────────

export const AGENT_SCHEDULING_WEBMASTER_EMAIL = "webmaster@rino3.com.br";

export const AGENT_SCHEDULING_GOOGLE_CALENDAR_HELP_URL =
  "https://support.google.com/calendar/answer/37082";
export const AGENT_SCHEDULING_GOOGLE_CALENDAR_OPEN_CONFIG_URL =
  "https://calendar.google.com/calendar/u/0/r/settings/calendar/primary?card=sharing";

export const AGENT_SCHEDULING_GIF_PATH = "/google-calendar.gif";

// Tokens disponíveis nos templates de título, descrição e confirmação, com a
// descrição exibida no tooltip de cada um.
export const AGENT_SCHEDULING_PLACEHOLDERS = [
  { token: "{{nome}}", description: "Nome do lead" },
  { token: "{{email}}", description: "E-mail do convidado" },
  { token: "{{telefone}}", description: "Telefone do lead" },
  { token: "{{resumo}}", description: "Resumo do caso" },
  { token: "{{agente}}", description: "Nome do assistente" },
  { token: "{{data}}", description: "Data da reunião" },
  { token: "{{hora}}", description: "Horário da reunião" },
  { token: "{{link}}", description: "Link do Google Meet" },
] as const;

// ─────────────────────────────────────────────────────────────────────────
// Agendamento — valores padrão (espelham os defaults das colunas em `agents`)
// ─────────────────────────────────────────────────────────────────────────

export const AGENT_DEFAULT_SCHEDULING_DURATION_MINUTES = 60;
export const AGENT_DEFAULT_SCHEDULING_INTERVAL_MINUTES = 60;

// Templates pré-preenchidos no formulário. NÃO são default da coluna no
// banco — as colunas são nullable e o usuário só persiste estes textos
// após validar a agenda (calendar_verified = true) e salvar o agente.
export const DEFAULT_MEETING_TITLE = "{{nome}} — Reunião";
export const DEFAULT_MEETING_DESCRIPTION =
  "📑 {{resumo}}\n\n• 📱 {{telefone}}\n• ✉️ {{email}}\n\nAtendimento conduzido por {{agente}}.";
export const DEFAULT_MEETING_CONFIRMATION_MESSAGE =
  "✅ Pronto! Sua reunião foi *agendada*.\n📅 Data: {{data}}\n🕒 Horário: {{hora}} (Brasília)\n🔗 Link: {{link}}\n*Se não aparecer no seu calendário, confirme pelo e-mail.*";

export const DEFAULT_REMINDER_ENABLED = true;
export const DEFAULT_REMINDER_MINUTES = 10;
export const DEFAULT_CALENDAR_VERIFIED = false;
export const DEFAULT_SCHEDULING_BLOCKED_TIMES = ["12:00"];
export const DEFAULT_SCHEDULING_BLOCKED_DATES: string[] = [];
