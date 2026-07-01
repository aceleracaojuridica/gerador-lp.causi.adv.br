# Changelog — Fix contacts-supabase-integration

## Rodada 1 — Bugs iniciais (11 correções em 7 arquivos)

### `src/forms/PersonForm/person-form.types.ts`
- Adicionadas props `onLoadingChange?: (loading: boolean) => void` e `onPendingChange?: (pending: boolean) => void` à interface `PersonFormProps`

### `src/forms/OrganizationForm/organization-form.types.ts`
- Adicionadas props `onLoadingChange?: (loading: boolean) => void` e `onPendingChange?: (pending: boolean) => void` à interface `OrganizationFormProps`

### `src/forms/PersonForm/person-form.tsx`
- **Bug 5 — Uncontrolled inputs:** `defaultValues` de campos opcionais (`instagram`, `facebook`, `linkedin`, `x`, `youtube`, `occupation`, `address`, `additional_info`) trocados de `undefined` → `""`. Idem no `form.reset()` do modo de edição (`?? ""`)
- **Bug 5 — Socials nulos:** serialização de socials trocada de `data.instagram ?? null` → `data.instagram || null` para tratar string vazia como `null`
- **Bug 2 — Loading state:** `useEffect` de edição passa a chamar `onLoadingChange?.(true)` antes do fetch e `onLoadingChange?.(false)` após `form.reset()` (inclusive em caso de erro)
- **Bug 1 — Submit pendente:** `startTransition` expõe pending via `onPendingChange?.(true)` no início do `onSubmit` e `onPendingChange?.(false)` em success e em error
- **Bug 3 — Form piscando:** `onSuccess?.()` substituído por `setTimeout(() => { onPendingChange?.(false); onSuccess?.(); }, 0)` para deferir o fechamento após o commit da transição
- **Bug 4 — Formato do telefone:** importado `parsePhoneNumber` de `react-phone-number-input`; em `onSubmit`, cada phone E.164 é parseado para extrair `nationalNumber` → `phone`, `countryCallingCode` → `country_code`, mantendo E.164 original em `full_phone`
- **Bug 6 — Duplicação phones/emails:** `phonesWithIds` e `originalPhoneIds` agora usam `data.phones[i].id` (ID real do banco) em vez de `phoneFields[i].id` (key UUID interna do RHF). Idem para emails
- **Debug:** removido `<pre>{JSON.stringify(form.watch(`phones.${index}`), null, 2)}</pre>` que estava exposto na UI

### `src/forms/OrganizationForm/organization-form.tsx`
- **Bug 2 — Loading state:** `useEffect` de edição passa a chamar `onLoadingChange?.(true/false)` antes/após o fetch
- **Bug 1 — Submit pendente:** `onPendingChange?.(true)` no início do `handleSubmit`; `onPendingChange?.(false)` em success e em error
- **Bug 3 — Form piscando:** `onSuccess?.()` substituído por `setTimeout(() => { onPendingChange?.(false); onSuccess?.(); }, 0)`

### `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
- Adicionado import de `Spinner`
- Adicionados estados `isPersonFormLoading` e `isPersonFormPending`
- `Dialog.onOpenChange` passa a resetar ambos os estados ao fechar
- `DialogContent` recebe overlay `<div className="absolute inset-0 z-20 ...">` com `<Spinner variant="primary">` quando `isPersonFormLoading`
- `PersonForm` recebe `onLoadingChange={setIsPersonFormLoading}` e `onPendingChange={setIsPersonFormPending}`
- Botão Submit: `disabled={isPersonFormPending || isPersonFormLoading}` + label dinâmico: `"Carregando..."` / `"Salvando..."` / `"Salvar"`

### `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`
- Mesmas alterações do `pessoas/page.client.tsx` aplicadas simetricamente para `OrganizationForm` (estados `isOrganizationFormLoading`, `isOrganizationFormPending`)

### `src/app/(app)/(pessoas)/pessoas/actions.ts`
- Tipos de `phones` em `createPersonAction` e `updatePersonAction` recebem campo `full_phone: string`
- `createPhonesJson`, `createPhones` e `updatePhones` passam a usar `p.full_phone` em vez de `p.phone` no campo `full_phone` enviado à RPC

---

## Rodada 2 — Bugs de array phones/emails (5 correções em 1 arquivo)

### `src/forms/PersonForm/person-form.tsx`

- **Bug 1 — Reset ao setar primário:** `setPrimaryPhone/Email` trocados de `{ ...phoneFields[i] }` (snapshot de registro do RHF, com valores obsoletos) para `{ ...form.getValues("phones")[i] }` (valores live). O snapshot antigo sobrescrevia o que o usuário havia digitado
- **Bug 2 — Form trava após adicionar e salvar:** consequência direta do bug 1 — com o valor live correto, o `phone` passado para `updatePhone` é o E.164 atual, que passa na validação `isPossiblePhoneNumber`; sem isso o campo voltava para `""` e bloqueava o submit
- **Bug 3 — Ordem dos phones/emails:** `person_phones` e `person_emails` são sorted por `id asc` antes do `form.reset()` no modo de edição
- **Bug 4 — Delete não persiste no banco:** `originalPhoneIds` e `originalEmailIds` no `onSubmit` agora leem de `originalPhoneIdsRef.current` e `originalEmailIdsRef.current` (refs preenchidas no `useEffect` de edição e resetadas para `[]` na montagem). Antes eram derivados de `data.phones` pós-remoção, então o ID deletado já havia sumido do array e nunca chegava em `p_delete_phone_ids` da RPC
- **Bug 5 — Primário deletado não transfere:** `removePhone/Email` substituídos por `handleRemovePhone/Email`, que verificam se o item removido era primário e, em caso positivo, promovem o item de índice 0 do array resultante como primário via `setTimeout(0)`
