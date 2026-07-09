import type { LeadLandingPageDto } from "@/app/actions/leads";

export type ContatosPeriodo = "hoje" | "semana" | "mes" | "todos";
export type ContatosOrdCampo = "data" | "nome";
export type ContatosOrdDir = "asc" | "desc";

export type ContatosFilterValues = {
  lpSlug: string;
  periodo: ContatosPeriodo;
  dia: Date | undefined;
  ordCampo: ContatosOrdCampo;
  ordDir: ContatosOrdDir;
};

export type ContatosFilterFormProps = {
  id: string;
  values: ContatosFilterValues;
  landingPages: LeadLandingPageDto[];
  allLpsValue: string;
  onValuesChange: (values: ContatosFilterValues) => void;
  onSubmit: (values: ContatosFilterValues) => void;
};
