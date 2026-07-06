/*
  Registro de chave string → nome Material (snake_case). O schema referencia
  ícones por chave serializável; seções resolvem no render com switch local.
  Chaves novas vindas da IA caem no fallback ("balance") sem quebrar o render.
*/
const REGISTRY: Record<string, string> = {
  "shield-check": "verified_user",
  clock: "schedule",
  handshake: "handshake",
  "file-x": "description",
  timer: "timer",
  alert: "warning",
  search: "search",
  calculator: "calculate",
  gavel: "gavel",
  bell: "notifications_active",
  banknote: "payments",
  trophy: "emoji_events",
  laptop: "laptop",
  star: "star",
  "user-check": "how_to_reg",
  "shield-x": "gpp_bad",
  scale: "balance",
  "heart-pulse": "monitor_heart",
  home: "home",
  briefcase: "work",
  users: "group",
  "file-text": "description",
  landmark: "account_balance",
  "badge-dollar": "paid",
  "hand-coins": "savings",
  stethoscope: "stethoscope",
  baby: "child_care",
  building: "apartment",
  car: "directions_car",
  scroll: "article",
};

// Chaves válidas de ícone — passadas para a IA escolher só destas.
export const ICON_KEYS = Object.keys(REGISTRY);
