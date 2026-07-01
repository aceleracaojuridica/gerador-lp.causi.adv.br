export type SearchParams = { [key: string]: string | string[] | undefined };

export function getParam(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function sanitizeSearchTerm(search: string | undefined): string {
  return (search?.trim() ?? "").replace(/[,()]/g, "");
}

export function parsePageParam(pageParam: string | undefined): number {
  const rawPage = Number(pageParam ?? 1);
  return Number.isFinite(rawPage) ? Math.max(0, rawPage - 1) : 0;
}

export function parseSortParam(
  sort: string | undefined,
  validSortFields: readonly string[],
  fallback: string,
): string {
  return sort && validSortFields.includes(sort) ? sort : fallback;
}

export function parseOrderParam(order: string | undefined): boolean {
  return order === "asc";
}

export type QueryValue = string | null | undefined;

/** Parâmetros de listagem derivados dos search params (page é 0-based). */
export interface ListQueryParams {
  search: string;
  sort: string;
  order: "asc" | "desc";
  page: number;
  pageSize: number;
}

/** Resultado de fetch de listagem para streaming via promise + use(). */
export type ListDataResult<TRow> = {
  rows: TRow[];
  totalCount: number;
  totalUnfiltered: number;
  error: string | null;
  outOfRange: boolean;
};

/** Converte índice de página 0-based para param de URL 1-based (ou null na primeira). */
export function pageIndexToUrlParam(pageIndex: number): QueryValue {
  return pageIndex > 0 ? String(pageIndex + 1) : null;
}

/** Monta currentParams para buildListUrl a partir de um objeto query. */
export function listQueryToUrlParams(
  query: Pick<ListQueryParams, "search" | "sort" | "order" | "page">,
  extras?: Record<string, QueryValue>,
): Record<string, QueryValue> {
  return {
    search: query.search || null,
    page: pageIndexToUrlParam(query.page),
    sort: query.sort,
    order: query.order,
    ...extras,
  };
}

/** Remove sort/order da URL quando são os valores padrão. */
export function omitDefaultListSort(
  params: Record<string, QueryValue>,
  defaults: { sort?: string; order?: string } = {},
) {
  const sort = defaults.sort ?? "created_at";
  const order = defaults.order ?? "desc";
  if (params.sort === sort && params.order === order) {
    params.sort = null;
    params.order = null;
  }
}

export function buildListUrl(options: {
  basePath: string;
  currentParams: Record<string, QueryValue>;
  overrides?: Record<string, QueryValue>;
  shouldOmit?: (params: Record<string, QueryValue>) => void;
}): string {
  const params = new URLSearchParams();
  const merged: Record<string, QueryValue> = {
    ...options.currentParams,
    ...(options.overrides ?? {}),
  };

  options.shouldOmit?.(merged);

  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, value);
    }
  }

  const queryString = params.toString();
  return queryString ? `${options.basePath}?${queryString}` : options.basePath;
}
