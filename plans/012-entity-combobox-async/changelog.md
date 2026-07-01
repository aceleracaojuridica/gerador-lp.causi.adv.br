# Changelog — EntityCombobox Async + useAccountSwitcher

**Data:** 27/04/2026

---

## Arquivos modificados

### `src/components/ui-patterns/entity-combobox.tsx`

- Adicionado import de `* as React`.
- Adicionadas 8 props opcionais à interface `EntityComboboxProps<T>`: `isLoading`, `onSearchChange`, `debounce`, `onScrollEnd`, `hint`, `open`, `onOpenChange`, `triggerVariant`.
- Implementado debounce interno via `useRef<ReturnType<typeof setTimeout>>` + `useEffect` de cleanup.
- `ComboboxInput` recebe `onChange={handleSearchChange}` quando `onSearchChange` está definido.
- `ComboboxList` recebe `onScroll={handleScroll}` quando `onScrollEnd` está definido; detecção por `e.currentTarget` sem `ref`.
- `ComboboxEmpty` só renderiza quando `!isLoading`.
- Adicionados footer `isLoading` ("Carregando...") e `hint` dentro de `ComboboxContent`, após `ComboboxList`.
- `<Combobox>` raiz recebe `open`/`onOpenChange` via spread condicional.
- Trigger `<Button>` usa `variant={triggerVariant}` (padrão `"input"` — comportamento idêntico ao anterior).
- Zero alterações em props existentes — nenhum uso existente (forms, etc.) foi afetado.

### `src/lib/session/actions.ts`

- Adicionado campo `pageSize: z.int().positive().default(20)` ao schema `getUserAccountsSchema`.
- `PAGE_SIZE` hardcoded substituído por `pageSize` no branch `super_admin`.
- Comportamento padrão idêntico (pageSize = 20).

### `src/components/system-bar.tsx`

- **Removidos:** `useDebounce` inline, todos os estados locais (`open`, `accounts`, `isLoading`, `isSwitching`, `page`, `hasMore`, `search`, `debouncedSearch`, `scrollRef`), 2 `useEffect`, `loadAccounts`, `handleScroll`, `handleSelect`.
- **Removidos imports:** `Check`, `KeyboardArrowDown`, `useRouter`, `React`, `toast`, `useSessionContext`, `Command*`, `Popover*`, `getUserAccountsAction`, `switchAccountAction`.
- **Adicionados:** `useAccountSwitcher`, `useSession`, `React.useMemo`.
- `Popover` + `Command` substituídos por `EntityCombobox`.
- `value` derivado com `useMemo` a partir da lista `accounts` para compatibilidade com a comparação por referência do Base UI (`data-selected`).
- Componente reduzido de ~200 para ~84 linhas.

### `src/components/ui-patterns/avatar-dropdown.tsx`

- Adicionado import de `invalidateAccountCache` de `@/hooks/use-account-switcher`.
- Após `logoutAction` com sucesso, chama `invalidateAccountCache(session.user.id)` antes de redirecionar para `/login`.

## Arquivos criados

### `src/hooks/use-account-switcher.ts`

- Hook client-side para troca de conta no `SystemBar`.
- Cache module-level (`Map<userId, CacheEntry>`), TTL de 30 minutos, chave por `session.user.id`.
- Fetch inicial: 30 itens + `total` em um único request ao abrir o dropdown.
- **Modo local**: quando `allAccounts.length >= total` — busca filtra localmente por `.includes()`, sem fetch.
- **Modo server-side**: quando há mais contas no banco — busca dispara fetch com `search:`, infinite scroll acumula páginas.
- `onScrollEnd`: guarda por `!isLoading && hasMore && !activeSearch`; acumula resultados; preserva `fetchedAt` original no cache.
- Cache **não** é invalidado ao trocar de conta — mantém dados em memória para reabertura rápida.
- Exporta `invalidateAccountCache(userId)` para uso no logout.
- Retorna: `{ accounts, isLoading, isSwitching, hint, open, onOpenChange, onSearchChange, onScrollEnd, switchAccount }`.

---

## Ajustes pós-implementação

| # | Ajuste | Arquivo |
|---|---|---|
| 1 | `data-selected` não marcava a conta ativa — corrigido com `useMemo` para derivar o item por referência da lista | `system-bar.tsx` |
| 2 | `emptyMessage` aparecia durante loading — corrigido com `!isLoading &&` | `entity-combobox.tsx` |
| 3 | Cache não invalidado ao trocar de conta (decisão: manter cache) | `use-account-switcher.ts` |
| 4 | TTL aumentado de 5 para 30 minutos | `use-account-switcher.ts` |
