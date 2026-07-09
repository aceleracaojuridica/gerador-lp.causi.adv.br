"use client";

import {
  ArrowDownward,
  ArrowUpward,
  Description,
  Download,
  Group,
} from "@material-symbols-svg/react";
import { Whatsapp } from "@thesvg/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { LeadDto } from "@/app/actions/leads";
import FilterIcon from "@/components/icons/filter-icon";
import { LeadAnswersSheet } from "@/components/leads/lead-answers-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ButtonSearch } from "@/components/ui-patterns/button-search";
import {
  Container,
  ContainerSection,
} from "@/components/ui-patterns/container";
import { EntityListTablePagination } from "@/components/ui-patterns/entity-list-table";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderHeading,
} from "@/components/ui-patterns/header";
import {
  ContatosFilterForm,
  type ContatosFilterValues,
} from "@/forms/ContatosFilterForm";
import { useLeads } from "@/hooks/use-leads";
import {
  csvCell,
  fmtData,
  hasCustomAnswers,
  lpLabelFromUrl,
  waLink,
} from "@/lib/leads/format";
import { cn } from "@/lib/utils";

const PER_PAGE = 20;
const FILTER_FORM_ID = "contatos-filter-form";

const DEFAULT_FILTERS: ContatosFilterValues = {
  lpSlug: "",
  periodo: "todos",
  dia: undefined,
  ordCampo: "data",
  ordDir: "desc",
};

function countAppliedFilters(
  filters: ContatosFilterValues,
  allLpsValue: string,
): number {
  let count = 0;
  if (filters.lpSlug && filters.lpSlug !== allLpsValue) count += 1;
  if (filters.dia || filters.periodo !== "todos") count += 1;
  if (filters.ordCampo !== "data" || filters.ordDir !== "desc") count += 1;
  return count;
}

function filtersAreEqual(a: ContatosFilterValues, b: ContatosFilterValues) {
  return (
    a.lpSlug === b.lpSlug &&
    a.periodo === b.periodo &&
    a.dia?.toDateString() === b.dia?.toDateString() &&
    a.ordCampo === b.ordCampo &&
    a.ordDir === b.ordDir
  );
}

function baixarCsv(linhas: LeadDto[]) {
  const cabecalho = ["Data", "Nome", "Telefone", "Página", "Respostas"];
  const corpo = linhas.map((l) =>
    [
      fmtData(l.created_at),
      l.nome ?? "",
      l.telefone ?? "",
      lpLabelFromUrl(l.page_url),
      JSON.stringify(l.answers ?? {}),
    ]
      .map(csvCell)
      .join(","),
  );
  const conteudo = `\uFEFF${[cabecalho.join(","), ...corpo].join("\r\n")}`;
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const hoje = new Date();
  const a = document.createElement("a");
  a.href = url;
  a.download = `contatos-${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ContatosPageClient() {
  const { leads, landingPages, loading, lpFilter, setLpFilter, allLpsValue } =
    useLeads();

  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [selectedLead, setSelectedLead] = useState<LeadDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ContatosFilterValues>({
    ...DEFAULT_FILTERS,
    lpSlug: allLpsValue,
  });
  const [draftFilters, setDraftFilters] = useState<ContatosFilterValues>({
    ...DEFAULT_FILTERS,
    lpSlug: allLpsValue,
  });

  const appliedFilterCount = useMemo(
    () => countAppliedFilters(appliedFilters, allLpsValue),
    [appliedFilters, allLpsValue],
  );

  const hasAppliedFilters = appliedFilterCount > 0;
  const isFilterApplyDisabled = filtersAreEqual(draftFilters, appliedFilters);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const seteDias = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const { periodo, dia } = appliedFilters;

    return leads.filter((l) => {
      if (q) {
        const nome = (l.nome ?? "").toLowerCase();
        const tel = (l.telefone ?? "").replace(/\D/g, "");
        const qDigits = q.replace(/\D/g, "");
        const answersText = Object.values(l.answers ?? {})
          .join(" ")
          .toLowerCase();
        const matchNome = nome.includes(q);
        const matchTel = qDigits.length > 0 && tel.includes(qDigits);
        const matchAnswers = answersText.includes(q);
        if (!matchNome && !matchTel && !matchAnswers) return false;
      }

      const t = new Date(l.created_at).getTime();
      if (dia) {
        const d0 = new Date(dia);
        d0.setHours(0, 0, 0, 0);
        const d1 = new Date(dia);
        d1.setHours(23, 59, 59, 999);
        return t >= d0.getTime() && t <= d1.getTime();
      }
      if (periodo === "hoje") return t >= inicioHoje.getTime();
      if (periodo === "semana") return t >= seteDias;
      if (periodo === "mes") return t >= inicioMes.getTime();
      return true;
    });
  }, [leads, busca, appliedFilters]);

  const ordenados = useMemo(() => {
    const { ordCampo, ordDir } = appliedFilters;
    const arr = [...filtrados];
    arr.sort((a, b) => {
      let cmp = 0;
      if (ordCampo === "data") {
        cmp =
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        cmp = (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR", {
          sensitivity: "base",
        });
      }
      return ordDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtrados, appliedFilters]);

  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / PER_PAGE));
  const pag = Math.min(pagina, totalPaginas);
  const inicio = (pag - 1) * PER_PAGE;
  const visiveis = ordenados.slice(inicio, inicio + PER_PAGE);

  function resetPagina() {
    setPagina(1);
  }

  function openAnswersSheet(lead: LeadDto) {
    setSelectedLead(lead);
    setSheetOpen(true);
  }

  function lpDisplayName(lead: LeadDto) {
    const slug = lpLabelFromUrl(lead.page_url);
    if (slug === "—") return slug;
    return `/${slug}`;
  }

  function applyFilters(values: ContatosFilterValues) {
    setAppliedFilters(values);
    setDraftFilters(values);
    if (values.lpSlug !== lpFilter) {
      setLpFilter(values.lpSlug);
    }
    resetPagina();
  }

  function clearFilters() {
    const reset = { ...DEFAULT_FILTERS, lpSlug: allLpsValue };
    setAppliedFilters(reset);
    setDraftFilters(reset);
    if (lpFilter !== allLpsValue) {
      setLpFilter(allLpsValue);
    }
    resetPagina();
  }

  function alternarOrd(campo: ContatosFilterValues["ordCampo"]) {
    const next: ContatosFilterValues = { ...appliedFilters };
    if (next.ordCampo === campo) {
      next.ordDir = next.ordDir === "asc" ? "desc" : "asc";
    } else {
      next.ordCampo = campo;
      next.ordDir = campo === "data" ? "desc" : "asc";
    }
    applyFilters(next);
  }

  return (
    <Container orientation="vertical" overflow="hidden">
      <Header>
        <HeaderContent>
          <HeaderHeading>
            <h1>Contatos</h1>
            <Badge variant="secondary" size="sm" className="font-medium">
              {leads.length}
            </Badge>
          </HeaderHeading>
        </HeaderContent>
        <HeaderActions>
          <ButtonSearch
            size="lg"
            placeholder="Buscar por nome ou telefone…"
            value={busca}
            onChange={(value) => {
              setBusca(value);
              resetPagina();
            }}
            disabled={loading}
          />
          <Popover
            onOpenChange={(open) => {
              if (open) setDraftFilters(appliedFilters);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline-light"
                size="icon-lg"
                disabled={loading}
                className="relative"
              >
                <FilterIcon
                  className={cn(appliedFilterCount > 0 ? "text-primary" : "")}
                />
                {appliedFilterCount > 0 ? (
                  <Badge className="absolute -top-2 -right-2 ml-auto size-4 min-w-none shrink-0 rounded-full p-0 text-[10px] leading-0">
                    {appliedFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-80 p-0">
              <div className="p-4">
                <ContatosFilterForm
                  key={`${draftFilters.lpSlug}-${draftFilters.periodo}-${draftFilters.dia?.toISOString() ?? ""}-${draftFilters.ordCampo}-${draftFilters.ordDir}`}
                  id={FILTER_FORM_ID}
                  values={draftFilters}
                  landingPages={landingPages}
                  allLpsValue={allLpsValue}
                  onValuesChange={setDraftFilters}
                  onSubmit={applyFilters}
                />
              </div>
              <div className="flex gap-2 border-t px-4 py-3">
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={!hasAppliedFilters}
                  onClick={clearFilters}
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  form={FILTER_FORM_ID}
                  className="flex-1"
                  disabled={isFilterApplyDisabled}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            disabled={ordenados.length === 0}
            onClick={() => baixarCsv(ordenados)}
          >
            <Download />
            Baixar CSV
          </Button>
        </HeaderActions>
      </Header>

      <ContainerSection grow overflow="hidden" className="min-h-0">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground sm:p-6">
            Carregando…
          </p>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Group />
                </EmptyMedia>
                <EmptyTitle>Nenhum contato ainda</EmptyTitle>
                <EmptyDescription>
                  Quando alguém preencher o formulário em uma das suas páginas
                  publicadas, o contato aparecerá aqui.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : ordenados.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum contato com esses filtros.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-border">
            <div className="flex-1 overflow-y-auto">
              <Table container={false}>
                <TableHeader>
                  <TableRow className="hover:bg-transparent [&_th:first-child]:pl-4 md:[&_th:first-child]:pl-7 [&_th:last-child]:pr-4 md:[&_th:last-child]:pr-7">
                    <TableHead className="w-12 text-muted-foreground">
                      #
                    </TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => alternarOrd("nome")}
                        className="inline-flex items-center gap-1 font-semibold"
                      >
                        Nome
                        {appliedFilters.ordCampo === "nome" ? (
                          appliedFilters.ordDir === "asc" ? (
                            <ArrowUpward className="size-3.5" />
                          ) : (
                            <ArrowDownward className="size-3.5" />
                          )
                        ) : null}
                      </button>
                    </TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>
                      <button
                        type="button"
                        onClick={() => alternarOrd("data")}
                        className="inline-flex items-center gap-1 font-semibold"
                      >
                        Data
                        {appliedFilters.ordCampo === "data" ? (
                          appliedFilters.ordDir === "asc" ? (
                            <ArrowUpward className="size-3.5" />
                          ) : (
                            <ArrowDownward className="size-3.5" />
                          )
                        ) : null}
                      </button>
                    </TableHead>
                    <TableHead className="w-24 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((lead, index) => (
                    <TableRow
                      key={lead.id}
                      className={cn(
                        "border-b text-muted-foreground [&_td:first-child]:pl-4 md:[&_td:first-child]:pl-7 [&_td:last-child]:pr-4 md:[&_td:last-child]:pr-7",
                        index % 2 === 0
                          ? "bg-background"
                          : "bg-muted/40 dark:bg-muted/20",
                      )}
                    >
                      <TableCell className="text-muted-foreground">
                        {inicio + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {lead.nome?.trim() || "—"}
                      </TableCell>
                      <TableCell>
                        {lead.telefone?.trim() || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {lead.page_url ? (
                          <Link
                            href={lead.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-primary hover:underline"
                          >
                            {lpDisplayName(lead)}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {fmtData(lead.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {lead.telefone?.trim() ? (
                            <Button
                              asChild
                              variant="outline"
                              size="icon-sm"
                              className="shrink-0"
                            >
                              <Link
                                href={waLink(lead.telefone, lead.nome)}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Abrir WhatsApp"
                              >
                                <Whatsapp className="size-4" />
                              </Link>
                            </Button>
                          ) : null}
                          {hasCustomAnswers(lead.answers) ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              className="shrink-0"
                              aria-label="Ver respostas"
                              onClick={() => openAnswersSheet(lead)}
                            >
                              <Description className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <EntityListTablePagination
              currentPage={pag - 1}
              pageCount={totalPaginas}
              isLoading={loading}
              onPageChange={(page) => setPagina(page + 1)}
            />
          </div>
        )}
      </ContainerSection>

      <LeadAnswersSheet
        lead={selectedLead}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </Container>
  );
}
