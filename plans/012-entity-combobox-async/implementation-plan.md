# Plano de Implementação — EntityCombobox Async + useAccountSwitcher

## Objetivo

Separar responsabilidades no `EntityCombobox` e no `SystemBar`:

- `EntityCombobox` deve cuidar apenas de UI e eventos — sem fetch, sem cache, sem paginação.
- A lógica de fetch, cache e paginação fica em quem usa o componente.
- Extrair toda a lógica do `SystemBar` para um hook `useAccountSwitcher`.
- Migrar o `SystemBar` para usar `EntityCombobox` + `useAccountSwitcher`.

O modo estático atual do `EntityCombobox` (receber `items` e filtrar localmente) **deve continuar funcionando** — nenhuma alteração nos usos existentes (`DealsCreateForm`, `DealsFilterForm`, `PersonForm`, etc.).

---

## Decisões de Projeto

| Questão | Decisão |
|---|---|
| Ordenação das contas no fetch | `name ASC` — manter o comportamento original |
| Escopo do cache | Module-level (global), chave por `session.user.id` — persiste entre re-montagens |
| TTL do cache | 30 minutos |
| Invalidar cache ao trocar de conta | Não — manter cache ao trocar de conta no `SystemBar` |
| Invalidar cache no logout | Sim — exportar `invalidateAccountCache(userId)` para chamar após `logoutAction` |
| Hint no modo local | Nenhum — a filtragem é transparente ao usuário |

---

## Arquivos a Modificar

| Arquivo | Operação |
|---|---|
| `src/components/ui-patterns/entity-combobox.tsx` | Adicionar props async |
| `src/lib/session/actions.ts` | Adicionar parâmetro `pageSize` |
| `src/components/system-bar.tsx` | Migrar para `EntityCombobox` + `useAccountSwitcher` |
| `src/components/ui-patterns/avatar-dropdown.tsx` | Chamar `invalidateAccountCache` no logout |

## Arquivos a Criar

| Arquivo | Descrição |
|---|---|
| `src/hooks/use-account-switcher.ts` | Hook com fetch, cache, busca e troca de conta |

---

## Fase 1 — Estender o `EntityCombobox`

### Novas props (todas opcionais)

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `isLoading` | `boolean` | `false` | Exibe "Carregando..." no rodapé da lista |
| `onSearchChange` | `(query: string) => void` | — | Emitido após debounce no campo de busca |
| `debounce` | `number` | `300` | Delay em ms do debounce |
| `onScrollEnd` | `() => void` | — | Emitido quando a lista rola até próximo do fim |
| `hint` | `string` | — | Mensagem informativa no rodapé (ex.: "Digite para encontrar mais") |
| `open` | `boolean` | — | Estado controlado de abertura |
| `onOpenChange` | `(open: boolean) => void` | — | Callback de abertura/fechamento |
| `triggerVariant` | `"input" \| "outline" \| "ghost" \| "secondary"` | `"input"` | Variante do botão trigger |

### Implementação

**Debounce interno (`onSearchChange`):**
- Usar `useRef<ReturnType<typeof setTimeout>>` para o timer.
- Limpar o timer em cada keystroke, disparar após `debounce`ms.
- Adicionar `onChange={handleSearchChange}` ao `ComboboxInput`.
- A filtragem local do Base UI continua funcionando normalmente.
- Limpar o timer no cleanup do `useEffect`.

**Infinite scroll (`onScrollEnd`):**
- Adicionar `onScroll={handleScroll}` ao `ComboboxList`.
- Detecção via `e.currentTarget` — sem `ref` adicional.
- Threshold: `scrollTop + clientHeight >= scrollHeight - 40`.

**`isLoading` e `hint`:**
- Renderizar como `<div>` não interativos dentro de `ComboboxContent`, **após** `<ComboboxList>`.
- `hint` só aparece quando `!isLoading`.
- `<ComboboxEmpty>` só renderiza quando `!isLoading`.

**`open`/`onOpenChange`:**
- Encaminhar ao `<Combobox>` raiz via spread condicional:
  ```ts
  const openProps = open !== undefined ? { open, onOpenChange } : { onOpenChange };
  ```

**`triggerVariant`:**
- Passar como `variant={triggerVariant}` ao `<Button>` no `render` prop do `ComboboxTrigger`.

---

## Fase 2 — Estender o `getUserAccountsAction`

- Adicionar `pageSize: z.int().positive().default(20)` ao schema `getUserAccountsSchema`.
- Substituir o `PAGE_SIZE = 20` hardcoded por `pageSize` no branch `super_admin`.
- Nenhuma alteração na lógica ou na ordenação.

---

## Fase 3 — Criar o Hook `useAccountSwitcher`

**Localização:** `src/hooks/use-account-switcher.ts`

### Cache module-level

```ts
type CacheEntry = { accounts: AccountItem[]; total: number; fetchedAt: number };
const accountCache = new Map<string, CacheEntry>(); // chave: session.user.id
const FIRST_PAGE_SIZE = 30;
const TTL_MS = 30 * 60 * 1000;
```

Exportar `invalidateAccountCache(userId: string)` para uso externo (logout).

### Estado interno

| State | Tipo | Propósito |
|---|---|---|
| `allAccounts` | `AccountItem[]` | Lista completa não filtrada (para modo local e cache) |
| `accounts` | `AccountItem[]` | Lista exibida (pode ser filtrada) |
| `total` | `number \| null` | Total de contas no banco |
| `isLoading` | `boolean` | Fetch em andamento |
| `isSwitching` | `boolean` | Troca de conta em andamento |
| `open` | `boolean` | Estado do popup |
| `page` | `number` | Página atual (infinite scroll) |
| `activeSearch` | `string` | Termo de busca ativo |

### Valores derivados (não são state)

```ts
const isLocalMode = total !== null && allAccounts.length >= total;
const hasMore = total !== null && allAccounts.length < total && !activeSearch;
const hint = !isLocalMode && !activeSearch && total !== null
  ? "Digite para encontrar mais resultados"
  : undefined;
```

### Comportamento ao abrir (`open === true`)

1. Verificar cache: se `Date.now() - entry.fetchedAt < TTL_MS`, usar dados em memória.
2. Caso contrário, fazer fetch `page: 1, pageSize: FIRST_PAGE_SIZE` e popular cache.

### `onSearchChange(query)`

| Condição | Comportamento |
|---|---|
| `query` vazio | Restaurar `accounts` a partir de `allAccounts` |
| `isLocalMode` | Filtrar `allAccounts` localmente por `.includes()` — sem fetch |
| Server-side | Fetch com `search: query, page: 1`; substituir `accounts` |

### `onScrollEnd()`

Guard: `!isLoading && hasMore && !activeSearch`. Fazer fetch da `page + 1`, acumular em `allAccounts` e `accounts`, atualizar cache preservando o `fetchedAt` original.

### `switchAccount(account)`

1. Se mesma conta — apenas fechar o popup.
2. Chamar `switchAccountAction({ accountId: account.id })`.
3. Em caso de sucesso: `setSession(() => result.session)` → `setOpen(false)` → `router.refresh()`.
4. Cache **não** é invalidado.

### Retorno do hook

```ts
return { accounts, isLoading, isSwitching, hint, open, onOpenChange, onSearchChange, onScrollEnd, switchAccount };
```

---

## Fase 4 — Migrar o `SystemBar`

### Remover

- `useDebounce` inline.
- Todos os states locais: `open`, `accounts`, `isLoading`, `isSwitching`, `page`, `hasMore`, `search`, `debouncedSearch`, `scrollRef`.
- Os 2 `useEffect`, `loadAccounts`, `handleScroll`, `handleSelect`.
- Imports: `Check`, `KeyboardArrowDown`, `useRouter`, `React`, `toast`, `useSessionContext`, `Command*`, `Popover*`, `getUserAccountsAction`, `switchAccountAction`.

### Adicionar

- `useAccountSwitcher()`.
- `useSession()` (em vez de `useSessionContext`).
- `React.useMemo` para derivar `currentAccount`.

### Markup

Substituir o bloco `<Popover>` + `<Command>` por:

```tsx
<EntityCombobox
  items={accounts}
  value={currentAccount ?? session.account}
  onValueChange={(account) => account && void switchAccount(account)}
  getLabel={(a) => a.name}
  getKey={(a) => String(a.id)}
  placeholder={session.account.name}
  searchPlaceholder="Buscar conta..."
  emptyMessage="Nenhuma conta encontrada."
  open={open}
  onOpenChange={onOpenChange}
  onSearchChange={onSearchChange}
  onScrollEnd={onScrollEnd}
  isLoading={isLoading}
  hint={hint}
  disabled={isSwitching}
  triggerVariant="input"
/>
```

### Atenção: `data-selected` e comparação por referência

O Base UI compara o `value` controlado com os itens da lista por **referência de objeto**. Passar `value={{ id, name }}` inline falha porque cria um novo objeto a cada render.

Solução: derivar via `useMemo` o item da lista já carregada:

```ts
const currentAccount = React.useMemo(
  () => accounts.find((a) => a.id === session.account.id) ?? null,
  [accounts, session.account.id],
);
```

Enquanto a lista não carrega, `currentAccount === null` e o trigger exibe o `placeholder` com o nome da conta.

---

## Fase 5 — Invalidação no Logout

**Arquivo:** `src/components/ui-patterns/avatar-dropdown.tsx`

Após `logoutAction` com sucesso, chamar `invalidateAccountCache(session.user.id)` antes de redirecionar:

```ts
const res = await logoutAction();
if (!res?.error) {
  invalidateAccountCache(session.user.id);
  router.replace("/login");
}
```