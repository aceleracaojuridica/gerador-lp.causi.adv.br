export const DEFAULT_FREE_PLAN_ID = 1;

export const DEFAULT_PIPELINE_NAME = "Pipeline";

export const DEFAULT_PIPELINE_STAGES = [
  { name: "Entrada", color: "#ABABAB", order: 1 },
  { name: "Contato realizado", color: "#0076E5", order: 2 },
  { name: "Negociação", color: "#BC15E5", order: 3 },
  { name: "Contrato enviado", color: "#35CA6E", order: 4 },
] as const;
