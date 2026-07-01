# Plan: Fix contacts-supabase-integration bugs

## TL;DR
6 bugs nos forms PersonForm/OrganizationForm e seus pages. As mesmas correções se aplicam às duas páginas (/pessoas e /organizacoes). Nenhuma mudança de banco necessária.

---

## Fase 1 — Types & Props (sem dependências)

**1.1** `src/forms/PersonForm/person-form.types.ts`  
- Adicionar `onLoadingChange?: (loading: boolean) => void`  
- Adicionar `onPendingChange?: (pending: boolean) => void`

**1.2** `src/forms/OrganizationForm/organization-form.types.ts`  
- Mesmas duas props adicionais

---

## Fase 2 — PersonForm (depende de 1.1)

**2.1** `src/forms/PersonForm/person-form.tsx` — Bug 5 (uncontrolled)
- `defaultValues` de campos opcionais: `instagram: ""`, `facebook: ""`, `linkedin: ""`, `x: ""`, `youtube: ""`, `occupation: ""`, `address: ""`, `additional_info: ""`
- `form.reset()` no edit mode: `?? ""` em vez de `?? undefined` para os mesmos campos
- Socials serialization: `data.instagram || null` em vez de `data.instagram ?? null` (trata string vazia como null)

**2.2** Bug 2 (loading state)
- Adicionar `const [isLoadingDetails, setIsLoadingDetails] = useState(false)`
- No `useEffect` de edição: `setIsLoadingDetails(true)` antes do import/fetch, `setIsLoadingDetails(false)` depois do `form.reset()`
- Chamar `onLoadingChange?.(true/false)` junto com o state interno
- Renderizar overlay: `<div className="absolute inset-0 flex items-center justify-center z-10 rounded-lg bg-background/80"> <Spinner variant="primary" size="md" /></div>` quando `isLoadingDetails`; o `<form>` precisa ter `className="relative ..."` para posicionar o overlay

**2.3** Bug 1 (submit disabled)
- Destructure `isPending` do `useTransition`: `const [isPending, startTransition] = useTransition()`
- Chamar `onPendingChange?.(true)` no início do `onSubmit` (antes do startTransition ou dentro dele como 1ª linha)
- Chamar `onPendingChange?.(false)` ao final (em success e em error)

**2.4** Bug 3 (form piscando)
- Após success no startTransition, deferir onSuccess: `setTimeout(() => onSuccess?.(), 0)` em vez de `onSuccess?.()`

**2.5** Bug 4 (phone format)  
- Importar `parsePhoneNumber` de `libphonenumber-js` no topo do form
- Em `onSubmit`, substituir `phonesWithIds` por lógica que parseia cada phone:
  ```
  const fullPhone = data.phones[i].phone // E.164 do input
  const parsed = parsePhoneNumber(fullPhone)
  phone: parsed?.nationalNumber ?? fullPhone
  country_code: String(parsed?.countryCallingCode ?? "")
  full_phone: fullPhone
  ```

**2.6** Bug 6 (duplicação phones/emails)
- `phonesWithIds`: usar `data.phones.map(p => ({ id: typeof p.id === 'number' ? p.id : undefined, ... }))` em vez de `phoneFields.map((f, i) => ({ id: typeof f.id === 'number' ? f.id : undefined, ... }))`
- `originalPhoneIds`: usar `data.phones.map(p => ...)` em vez de `phoneFields.map(f => ...)`
- Mesma correção para `emailsWithIds` e `originalEmailIds`

**2.7** Debug removal
- Remover `<pre>{JSON.stringify(form.watch(`phones.${index}`), null, 2)}</pre>` da renderização dos phone fields

---

## Fase 3 — OrganizationForm (depende de 1.2, paralelo com Fase 2)

**3.1** `src/forms/OrganizationForm/organization-form.tsx` — Bug 2 (loading state)
- Adicionar `const [isLoadingDetails, setIsLoadingDetails] = useState(false)`
- No `useEffect` de edição: set loading before/after fetch + chamar `onLoadingChange?.(true/false)`
- Overlay no form com `relative` + `<Spinner variant="primary" size="md" />`

**3.2** Bug 1 (submit disabled)
- Destructure `isPending` do `useTransition`
- Chamar `onPendingChange?.(true/false)` no handleSubmit

**3.3** Bug 3 (form piscando)
- `setTimeout(() => onSuccess?.(), 0)` em vez de `onSuccess?.()`

---

## Fase 4 — pessoas/page.client.tsx (depende de Fase 2)

**4.1** Adicionar estados:
```js
const [isPersonFormLoading, setIsPersonFormLoading] = useState(false)
const [isPersonFormPending, setIsPersonFormPending] = useState(false)
```

**4.2** Passar props para PersonForm:
```jsx
onLoadingChange={setIsPersonFormLoading}
onPendingChange={setIsPersonFormPending}
```

**4.3** Overlay sobre DialogContent:
- `<DialogContent className="relative">` (adicionar `relative`)
- Dentro do DialogContent (antes do DialogHeader): renderizar overlay quando `isPersonFormLoading`
- `<div className="absolute inset-0 flex items-center justify-center z-20 bg-background/80 rounded-lg"> <Spinner .../> </div>`

**4.4** Botão Submit:
```jsx
<Button
  type="submit"
  size="lg"
  form="person-form"
  disabled={isPersonFormPending || isPersonFormLoading}
>
  {isPersonFormLoading ? "Carregando..." : isPersonFormPending ? "Salvando..." : "Salvar"}
</Button>
```

**4.5** Reset dos estados ao fechar o dialog (no `onOpenChange` do Dialog)

---

## Fase 5 — organizacoes/page.client.tsx (depende de Fase 3, paralelo com Fase 4)

Mesmas mudanças de Fase 4 para OrganizationForm.

---

## Fase 6 — Actions pessoas (depende de Fase 2, paralelo com Fases 4-5)

**6.1** `src/app/(app)/(pessoas)/pessoas/actions.ts`  
- Tipo `phones` parse em `createPersonAction`: adicionar `full_phone: string`
- `createPhonesJson`: usar `full_phone: p.full_phone` em vez de `full_phone: p.phone`
- Tipo `phones` parse em `updatePersonAction`: adicionar `full_phone: string`
- `createPhones` e `updatePhones`: usar `full_phone: p.full_phone` em vez de `full_phone: p.phone`

---

## Arquivos modificados

- `src/forms/PersonForm/person-form.types.ts`
- `src/forms/PersonForm/person-form.tsx`
- `src/forms/OrganizationForm/organization-form.types.ts`
- `src/forms/OrganizationForm/organization-form.tsx`
- `src/app/(app)/(pessoas)/pessoas/page.client.tsx`
- `src/app/(app)/(pessoas)/organizacoes/page.client.tsx`
- `src/app/(app)/(pessoas)/pessoas/actions.ts`

## Verificação

1. Criar pessoa com telefone → verificar no banco: `phone` = nacional, `country_code` = "55", `full_phone` = E.164
2. Editar pessoa → formulário mostra spinner enquanto carrega, botão "Carregando..."
3. Salvar edição → botão "Salvando...", form fecha sem piscar
4. Editar pessoa com telefone existente → salvar → verificar que não duplica no banco
5. Digitar em Instagram/Cargo/Endereço → sem erro de controlled/uncontrolled no console
6. Mesmos cenários em /organizacoes
