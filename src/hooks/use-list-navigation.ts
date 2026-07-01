"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { buildListUrl, type QueryValue } from "@/lib/search-params";

/**
 * Encapsula router.push + useTransition + buildListUrl para navegação de lista
 * com query params (busca, ordenação, paginação).
 *
 * Uso: `const nav = useListNavigation({ basePath, currentParams, shouldOmit })`
 * Navegar: `nav.navigate({ search: 'foo', page: null })`
 * Loading: `nav.isFetching`
 */
export function useListNavigation(options: {
  basePath: string;
  currentParams: Record<string, QueryValue>;
  shouldOmit?: (params: Record<string, QueryValue>) => void;
}) {
  const router = useRouter();
  const [isFetching, startTransition] = useTransition();

  const navigate = (overrides: Record<string, QueryValue>) =>
    startTransition(() => router.push(buildListUrl({ ...options, overrides })));

  return { isFetching, navigate };
}
