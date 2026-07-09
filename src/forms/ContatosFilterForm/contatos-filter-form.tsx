"use client";

import {
  ArrowDownward,
  ArrowUpward,
  CalendarToday,
  Event,
  Person,
} from "@material-symbols-svg/react/rounded/w600";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import type { LeadLandingPageDto } from "@/app/actions/leads";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  EntityCombobox,
  EntityComboboxContent,
  EntityComboboxInputTrigger,
} from "@/components/ui-patterns/entity-combobox";
import {
  EntityItem,
  EntityItemDescription,
  EntityItemTextGroup,
  EntityItemTitle,
} from "@/components/ui-patterns/entity-item";
import { cn } from "@/lib/utils";
import type {
  ContatosFilterFormProps,
  ContatosFilterValues,
  ContatosOrdCampo,
  ContatosPeriodo,
} from "./contatos-filter-form.types";

const PERIODOS: { value: ContatosPeriodo; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
  { value: "todos", label: "Todos" },
];

type LpFilterOption = LeadLandingPageDto & {
  isAll?: boolean;
};

function lpFilterLabel(lp: LpFilterOption): string {
  if (lp.isAll) return "Todas as páginas";
  return `/${lp.slug}`;
}

function lpFilterDescription(lp: LpFilterOption): string {
  if (lp.isAll) return "Exibir contatos de todas as landing pages";
  const parts = [lp.name.trim(), lp.officeSubdomain.trim()].filter(Boolean);
  return parts.join(" · ");
}

function updateValues(
  current: ContatosFilterValues,
  patch: Partial<ContatosFilterValues>,
  onValuesChange: (values: ContatosFilterValues) => void,
) {
  onValuesChange({ ...current, ...patch });
}

export function ContatosFilterForm({
  id,
  values,
  landingPages,
  allLpsValue,
  onValuesChange,
  onSubmit,
}: ContatosFilterFormProps) {
  const lpOptions = useMemo<LpFilterOption[]>(
    () => [
      {
        slug: allLpsValue,
        name: "Todas as páginas",
        officeSubdomain: "",
        isAll: true,
      },
      ...landingPages,
    ],
    [allLpsValue, landingPages],
  );

  const selectedLp = useMemo(
    () => lpOptions.find((lp) => lp.slug === values.lpSlug) ?? lpOptions[0],
    [lpOptions, values.lpSlug],
  );

  function handlePeriodoChange(periodo: ContatosPeriodo) {
    updateValues(values, { periodo, dia: undefined }, onValuesChange);
  }

  function handleOrdCampoChange(campo: ContatosOrdCampo) {
    if (values.ordCampo === campo) {
      updateValues(
        values,
        { ordDir: values.ordDir === "asc" ? "desc" : "asc" },
        onValuesChange,
      );
      return;
    }
    updateValues(
      values,
      { ordCampo: campo, ordDir: campo === "data" ? "desc" : "asc" },
      onValuesChange,
    );
  }

  return (
    <form
      id={id}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
    >
      <Field>
        <FieldLabel>Página</FieldLabel>
        <EntityCombobox
          items={lpOptions}
          value={selectedLp}
          onValueChange={(lp) =>
            lp && updateValues(values, { lpSlug: lp.slug }, onValuesChange)
          }
          getLabel={(lp) =>
            lp.isAll
              ? "Todas as páginas"
              : `${lp.name} /${lp.slug} ${lp.officeSubdomain}`.trim()
          }
          getKey={(lp) => lp.slug}
          searchPlaceholder="Buscar por nome ou slug…"
          emptyMessage="Nenhuma página encontrada"
        >
          <EntityComboboxInputTrigger
            triggerVariant="input"
            size="sm"
            placeholder="Todas as páginas"
          >
            {(lp: LpFilterOption) => (
              <span className="min-w-0 truncate">{lpFilterLabel(lp)}</span>
            )}
          </EntityComboboxInputTrigger>
          <EntityComboboxContent>
            {(lp: LpFilterOption) => (
              <EntityItem>
                <EntityItemTextGroup>
                  <EntityItemTitle>{lpFilterLabel(lp)}</EntityItemTitle>
                  <EntityItemDescription>
                    {lpFilterDescription(lp)}
                  </EntityItemDescription>
                </EntityItemTextGroup>
              </EntityItem>
            )}
          </EntityComboboxContent>
        </EntityCombobox>
      </Field>

      <Field>
        <FieldLabel>Período</FieldLabel>
        <ToggleGroup
          type="single"
          variant="secondary"
          value={values.periodo}
          onValueChange={(val) =>
            val && handlePeriodoChange(val as ContatosPeriodo)
          }
          size="sm"
          stretch
          spacing={1.2}
          className="w-full"
        >
          {PERIODOS.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              aria-label={label}
              className={cn(
                values.dia && value === values.periodo && "opacity-50",
              )}
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>

      <Field>
        <FieldLabel>Dia específico</FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="input-button"
              size="sm"
              className="w-full justify-start font-normal"
            >
              <CalendarToday />
              {values.dia
                ? format(values.dia, "dd/MM/yyyy", { locale: ptBR })
                : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={values.dia}
              locale={ptBR}
              onSelect={(date) => {
                updateValues(
                  values,
                  { dia: date, periodo: date ? "todos" : values.periodo },
                  onValuesChange,
                );
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>

      <Field>
        <FieldLabel>Ordenar por</FieldLabel>
        <ToggleGroup
          type="single"
          variant="secondary"
          value={values.ordCampo}
          onValueChange={(val) =>
            val && handleOrdCampoChange(val as ContatosOrdCampo)
          }
          size="sm"
          orientation="vertical"
          stretch
          spacing={1.2}
          className="w-full"
        >
          <ToggleGroupItem value="data" aria-label="Ordenar por data">
            <Event />
            Data
            {values.ordCampo === "data" ? (
              values.ordDir === "asc" ? (
                <ArrowUpward className="ml-auto size-5 rounded-sm border border-primary/20 bg-card p-0.5" />
              ) : (
                <ArrowDownward className="ml-auto size-5 rounded-sm border border-primary/20 bg-card p-0.5" />
              )
            ) : null}
          </ToggleGroupItem>
          <ToggleGroupItem value="nome" aria-label="Ordenar por nome">
            <Person />
            Nome
            {values.ordCampo === "nome" ? (
              values.ordDir === "asc" ? (
                <ArrowUpward className="ml-auto size-5 rounded-sm border border-primary/20 bg-card p-0.5" />
              ) : (
                <ArrowDownward className="ml-auto size-5 rounded-sm border border-primary/20 bg-card p-0.5" />
              )
            ) : null}
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>
    </form>
  );
}
