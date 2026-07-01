# Form review with react-hook-form-zod
_Exported on 5/8/2026 at 12:09:04 GMT-4 from Cursor (3.3.27)_

---

**User**

## Objetivo

Use a skill `react-hook-form-zod` para revisar os seguintes forms:

- Pessoas: @src/forms/PersonForm/person-form.tsx 
- Organizações: @src/forms/OrganizationForm/organization-form.tsx 

Após sua revisão, classifique cada ponto como **correção** (algo incorreto ou quebrado) ou **melhoria** (algo funcional mas que pode ser aprimorado), descreva o motivo e indique o que deve ser feito.

## Formato do plano

Organize a saída em:
1. **Diagnóstico** — lista de correções e melhorias encontradas.
2. **Plano de ação** — sequência de alterações a serem feitas.

---

**Cursor**

Vou ler os schemas e os arquivos de tipos para compreender melhor o contexto antes de fazer a revisão.

Tenho contexto suficiente para gerar o plano. Vou criar o plano de revisão direto, organizado em diagnóstico (correções vs. melhorias) e plano de ação. Não vou abrir as server actions para confirmar a validação server-side; isso vira um item explícito de verificação no plano.

---

**User**

**Algumas considerações sobre o plano:**

@revisão_personform_e_organizationform_4df8b0e4.plan.md (8-9) o EntityCombobox possui debounce, verificar o componente.

@revisão_personform_e_organizationform_4df8b0e4.plan.md (63-64) adicionar um limite de 5 telefones/emails no zod (embora a UI já limite a 5, ver se é necessário, talvez pra reforçar a validação). Já o alerta do principal acho que não é possível não existir um telefone primário pois ao remover o principal, automaticamente ele aplica no primeiro da lista (se houver).

**Adicionar ao plano:**

Verificar quais itens precisa adicionar trim() no zod, como por exemplo no `name` do OrganizationForm.

Adicionar mascara e validação de CNPJ no OrganizationForm. Já existe uma biblioteca no projeto para mask `react-input-mask`. O CNPJ é validado sem mascara, e salvo no banco sem mascara também, apenas os digitos.

---

**Cursor**

Vou verificar o `EntityCombobox` para confirmar o debounce e checar a biblioteca `react-input-mask` no projeto.

Vou checar como `react-input-mask` está sendo usado no projeto e também procurar utilitários de validação de CNPJ existentes.

Vou ler o plano atual para fazer as atualizações.

Verifiquei: o `EntityCombobox` já aplica debounce (500ms via `handleSearchChange`), então o C1 muda de escopo (mantém só cancellation/cleanup). E `react-input-mask@3.0.0-alpha.2` está instalado mas ainda não é usado em nenhum form. Vou atualizar o plano.

Agora vou adicionar as duas novas correções (C7: trim, C8: CNPJ) entre C6 e a seção de melhorias.

Agora vou atualizar a seção do Plano de Ação (mermaid + Fase 1) para refletir as mudanças.

Vou também ajustar o "Resumo" interno do diagnóstico (introdução da seção 1.1) para refletir os 8 itens, e limpar um typo isolado ("55" perdido no fim da seção 1.2).

Plano atualizado. Resumo das mudanças aplicadas:

## Ajustes baseados no seu feedback

**C1 — Reduzido o escopo.** Confirmei em [entity-combobox.tsx](src/components/ui-patterns/entity-combobox.tsx) (linhas 121–145) que o `EntityCombobox` já aplica debounce de 500ms via `handleSearchChange` antes de chamar `onSearchChange`. Removi a parte de "adicionar debounce" — só mantive o cancellation flag (race condition residual + cleanup ao desmontar).

**C6 — Reescrito.** Agora cobre dois pontos:
- Adicionar `.max(5, "...")` no Zod para `phones` e `emails` (defesa em profundidade reforçando o limite da UI)
- Remover os blocos `errors.phones?.root` / `errors.emails?.root` mortos
- Concordo: validação de "primário obrigatório" não é necessária — a lógica de remoção (após C2) garante que sempre exista um primário.

## Novas correções adicionadas

**C7 — `.trim()` em campos textuais.** Cobre o `name` do OrganizationForm (sem `.trim()` atualmente — aceita `"   "`) e estende para os demais campos textuais opcionais de ambos os schemas (`occupation`, `address`, `additional_info`, sociais, labels de phones/emails).

**C8 — Máscara e validação de CNPJ no OrganizationForm.** Plano detalhado:
- Criar [src/lib/validators/cnpj.ts](src/lib/validators/cnpj.ts) com `stripCnpjMask`, `formatCnpj`, `isValidCnpj`
- Schema com `.transform(stripCnpjMask).refine(isValidCnpj, ...)` — garante que o valor que sai do schema são apenas os 14 dígitos
- Criar [src/components/ui-patterns/cnpj-input.tsx](src/components/ui-patterns/cnpj-input.tsx) usando `react-input-mask@3.0.0-alpha.2` (já em [package.json](package.json) linha 53, ainda não usado)
- Atenção: a versão alpha precisa ser testada com React 19 — incluí fallback para máscara manual caso haja incompatibilidade
- Modo edição: aplicar `formatCnpj` no `form.reset(...)` para exibir mascarado vindo do banco
- Auditar a server action de organização para confirmar persistência apenas dos dígitos

O plano agora tem **8 correções** (C1–C8) e **10 melhorias** (M1–M10). Posso prosseguir com a implementação ou ainda há ajustes?

---

**User**

Ok, pode implementar.

---

**Cursor**

Vou criar a lista de tarefas e começar com as correções. Primeiro vou ler os arquivos auxiliares necessários (location-combobox, actions, e ver a API do react-input-mask).

Tenho todo o contexto necessário. Vou implementar começando pelos schemas e utilitários.

### Stage 1: Criar utilitário CNPJ + types do react-input-mask + schemas

Agora vou criar a declaração de tipos para `react-input-mask` (sem `@types` oficial).

Agora vou atualizar os schemas (C7, C6, M10, e parte do C8).

### Stage 2: Criar `CnpjInput`

Vou refinar o `CnpjInput` para alinhar exatamente ao contrato do `react-input-mask` (props especiais ficam no `InputMask`, demais no `<Input>` via spread).

### Stage 3: Reescrever OrganizationForm

### Stage 4: Reescrever PersonForm

Devido à complexidade, vou estruturar com sub-componentes `PhoneRow`, `EmailRow` e `CityField` (M9, M2). Leio mais uma vez para confirmar trechos críticos antes de reescrever.

Vou rodar o lint para validar.

Apenas problemas de formatação. Vou rodar o auto-fix do Biome.

Lint OK. Vou rodar o type check para garantir que tudo passa no TypeScript estrito.

TypeScript check passa sem erros. Vou limpar o log temporário.

Vou fazer uma rodada final de verificação visual lendo os arquivos depois do formatador do Biome, para confirmar que ficaram bons.

Implementação completa. Resumo do que foi feito:

## Arquivos criados

- **[src/lib/validators/cnpj.ts](src/lib/validators/cnpj.ts)** — utilitários `stripCnpjMask`, `formatCnpj`, `isValidCnpj` (validação por DV da Receita Federal, rejeita sequência de iguais).
- **[src/components/ui-patterns/cnpj-input.tsx](src/components/ui-patterns/cnpj-input.tsx)** — wrapper sobre `react-input-mask` com máscara `00.000.000/0000-00`. Mantém o valor mascarado no form; conversão para dígitos puros acontece no submit.
- **[src/types/react-input-mask.d.ts](src/types/react-input-mask.d.ts)** — tipos TypeScript para `react-input-mask` (sem `@types` oficial).

## Arquivos modificados

### [src/forms/OrganizationForm/schema.ts](src/forms/OrganizationForm/schema.ts)
- `name`, `address`, `additional_info` ganharam `.trim()` (C7).
- `cnpj` agora valida via `isValidCnpj(stripCnpjMask(...))` (C8).

### [src/forms/PersonForm/schema.ts](src/forms/PersonForm/schema.ts)
- `.trim()` em `occupation`, `address`, `additional_info`, todas as redes sociais e labels de phone/email (C7).
- `phones` e `emails` agora têm `.max(5, ...)` (C6).
- Mensagem do `phone.min(1)` mudada para `"Informe o telefone"` (M10).

### [src/forms/OrganizationForm/organization-form.tsx](src/forms/OrganizationForm/organization-form.tsx)
- Removido `setTimeout(0)` do submit (C4).
- `state`/`city` padronizados com `""` (C5).
- CNPJ agora usa `<CnpjInput>`; submit usa `stripCnpjMask`; reset em modo edição usa `formatCnpj` (C8).
- `aria-invalid` adicionado em todos inputs (M3).
- `<CityField>` extraído usando `useWatch` em vez de `form.watch` (M2).
- `mode: "onBlur"` (M8).
- Cancellation flag no `useEffect` de carregamento.

### [src/forms/PersonForm/person-form.tsx](src/forms/PersonForm/person-form.tsx)
- **C1**: cancellation flag no useEffect de busca de organizações (debounce já vinha do `EntityCombobox`).
- **C2**: `handleRemovePhone`/`handleRemoveEmail` reescritos com `replace()` atômico, sem `setTimeout`.
- **C3**: `setPrimaryPhone`/`setPrimaryEmail` usam `replace()` com map único.
- **C6**: blocos `errors.phones?.root` / `errors.emails?.root` removidos.
- **M1**: `name`, `occupation`, `address`, `additional_info` e socials migrados de `Controller` para `register`.
- **M2**: `<CityField>` sub-componente com `useWatch({ name: "state" })`.
- **M3**: `aria-invalid` consistente em todos os inputs.
- **M4**: `photoErrorMessage` (state separado) substituído por `form.setError("photo", ...)` / `form.clearErrors("photo")`.
- **M5**: `getPersonDetailsAction` e `persistPersonPhotoAction` agora têm import estático no topo.
- **M6**: `state`/`city` padronizados com `""` no defaultValue/onChange e `?? null` apenas para o combobox.
- **M9**: `<PhoneRow>` e `<EmailRow>` extraídos com `useWatch({ name: "phones.${index}.is_primary" })` para isolar re-renders.
- **M8**: `mode: "onBlur"`.
- **`<SocialField>`** extraído como componente reutilizável para os 5 inputs sociais.

## Verificação

- `pnpm lint` → exit 0
- `pnpm exec tsc --noEmit` → exit 0

## Não implementado (por decisão consciente)

- **M7 (validação server-side com Zod)**: fica fora do escopo destes arquivos. Hoje as actions [organizacoes/actions.ts](src/app/(app)/(pessoas)/organizacoes/actions.ts) e [pessoas/actions.ts](src/app/(app)/(pessoas)/pessoas/actions.ts) usam `toStr()` (trim manual) e validação ad-hoc. **Recomendo um follow-up** para reaproveitar `organizationFormSchema` / `personFormSchema` no servidor após reidratar `phones`/`emails` do JSON. Ainda mais relevante agora que adicionamos `.trim()`, `.max(5)` e validação de CNPJ — qualquer cliente bypassando o front pode injetar dados inválidos.

Quer que eu siga com M7 já?

---

**User**

**Próximos passos:**
1. Revise a implementação: notei que faltou "substituir Controller por register" no OrganizationForm. Observe como está o PersonForm para manter o mesmo padrão de implementação.
2. Implemente o M7, usando o @temp/example.tsx como uma referência de implementação e aplique as melhorias que achar necessário.

**Considerações:**
- C8: Máscara e validação de CNPJ: removi essa implementação, vou fazer depois, pode ignorar.
- M8: mode de validação: alterei para onSubmit.
- M9: Mensagem de erro de telefone vazio: deixei o valor antigo.
- Não rodar pnpm lint e pnpm build. Eu vou fazer isso depois.

---

**Cursor**

Perfeito — vou ajustar o `OrganizationForm` para seguir o padrão de `register` do `PersonForm` e depois implementar o M7 nas server actions usando `@temp/example.tsx` como referência. Primeiro vou ler esses arquivos para garantir consistência com o estado atual que você deixou.

Vou aplicar duas frentes agora:  
1) ajustar o `OrganizationForm` para usar `register` nos campos simples e remover o que sobrou do CNPJ mascarado;  
2) implementar validação server-side no `pessoas/actions.ts` (M7), no mesmo padrão do `example`.

Ajustes feitos conforme seus próximos passos e considerações.

### O que foi alterado

#### 1) `OrganizationForm`: padronizado com `register` (igual ao `PersonForm`)
Arquivo: `src/forms/OrganizationForm/organization-form.tsx`

- Substituí `Controller` por `register` nos campos simples:
  - `name`
  - `cnpj`
  - `address`
  - `additional_info`
- Mantive `Controller` apenas onde faz sentido (combobox de `state`/`city`).
- Mantive `mode: "onSubmit"` (como você pediu).
- Removi dependências da implementação de máscara/normalização de CNPJ nesse form:
  - saiu `CnpjInput`
  - saiu `formatCnpj` / `stripCnpjMask`
  - voltou para `Input` simples em `cnpj`.

---

#### 2) C8 ignorado (revert parcial)
Arquivo: `src/forms/OrganizationForm/schema.ts`

- Removi validação de CNPJ via utilitário.
- `cnpj` ficou como:
  - `z.string().trim().optional()`

Ou seja, sem máscara e sem validação específica de CNPJ, conforme sua instrução.

---

#### 3) M7 implementado nas actions de Pessoas (server-side validation com schema)
Arquivo: `src/app/(app)/(pessoas)/pessoas/actions.ts`

- Importei `personFormSchema`.
- Adicionei helper `validatePersonFormData(formData)` que:
  - parseia JSON de `phones`, `emails`, `socials`
  - valida tudo via `personFormSchema.safeParse(...)`
  - retorna mensagem de erro amigável se JSON vier inválido
- `createPersonAction` e `updatePersonAction` agora:
  - validam payload com schema antes de persistir
  - usam os valores validados para `name`, `occupation`, `state`, `city`, `address`, `additional_info`
- Melhoria adicional aplicada:
  - `full_phone` agora usa fallback para `phone` se vier ausente no payload (`full_phone ?? phone`), evitando inconsistência.

---

### Observações rápidas

- Não rodei `pnpm lint` nem `pnpm build`, como você pediu.
- Chequei apenas diagnósticos locais com `ReadLints` para os arquivos alterados e não apareceu erro.
- Mantive intacto o que você pediu para não mexer (C8 e modo de validação ajustado para `onSubmit` no `OrganizationForm`).

Se quiser, no próximo passo eu faço uma passada específica para aplicar o mesmo padrão de validação server-side também no fluxo de organizações (seu `actions.ts` já está próximo disso, dá para padronizar 100% com pessoas).

---

**User**

Agora o mesmo que você aplicou da M7 para actions de pessoas, faça o mesmo na actions de organizações, mantendo a consistência de implementação entre os dois.

---

**Cursor**

Vou aplicar o mesmo padrão da M7 em `organizacoes/actions.ts` (helper de validação com schema + uso dos valores validados em create/update), espelhando o estilo que ficou em `pessoas/actions.ts`.

Feito — apliquei o mesmo padrão da M7 em `organizacoes/actions.ts`, mantendo consistência com `pessoas/actions.ts`.

### O que foi adicionado

No arquivo `src/app/(app)/(pessoas)/organizacoes/actions.ts`:

- Import do schema:
  - `organizationFormSchema`
- Helper novo:
  - `toRawString(...)`
- Helper de validação centralizada:
  - `validateOrganizationFormData(formData)` com `organizationFormSchema.safeParse(...)`

### O que mudou nas actions

#### `createOrganizationAction`
- Antes: validava só `name` com `toStr`.
- Agora:
  - valida o payload inteiro via `validateOrganizationFormData`
  - retorna erro de validação com a primeira issue do Zod
  - usa `validation.data` para persistir
  - normaliza opcionais para `null` no banco (`cnpj`, `state`, `city`, `address`, `additional_info`)

#### `updateOrganizationAction`
- Antes: validava só `organizationId` e `name`.
- Agora:
  - mantém validação de `organizationId`
  - valida o restante do payload via `validateOrganizationFormData`
  - usa `validation.data` no update
  - mesma normalização para `null` dos campos opcionais

### Verificação rápida
- Rodei apenas `ReadLints` no arquivo alterado.
- Sem erros de lint reportados.
- Não rodei `pnpm lint` / `pnpm build` (conforme seu pedido).

---

**User**

Preciso que você ajuste o arquivo `actions.ts` de organizations para ficar consistente com o de persons. Faça as seguintes mudanças:

1. **Retorno do `updateOrganizationAction`**: altere para retornar `{ organizationId: number }` no sucesso, igual ao que `updatePersonAction` faz com `personId`.

2. **Helpers duplicados** (`toStr`, `toRawString`, `toOptionalNumber`): esses helpers existem identicamente nos dois arquivos. Extraia-os para um arquivo compartilhado no local mais apropriado do projeto, e importe nos dois `actions.ts`.

3. **Contrato da função de validação**: `validateOrganizationFormData` retorna o resultado bruto do `safeParse` do Zod, enquanto `validatePersonFormData` já encapsula a mensagem internamente. Atualize `validateOrganizationFormData` para seguir o mesmo padrão de persons, e ajuste os pontos de uso na action accordingly.

---

**Cursor**

Entendi — vou padronizar `organizations/actions.ts` com o mesmo estilo de `persons/actions.ts`, extrair os helpers para um módulo compartilhado e ajustar o contrato da validação para encapsular a mensagem. Vou aplicar as mudanças diretamente nos dois arquivos de action + novo utilitário compartilhado.

Vou extrair os helpers para `src/lib/form-data.ts` e depois ajustar `pessoas/actions.ts` e `organizacoes/actions.ts` para importar dele. Em seguida atualizo o contrato de `validateOrganizationFormData` e o retorno do `updateOrganizationAction`.

Concluído — os 3 ajustes foram aplicados com consistência entre `organizations/actions.ts` e `persons/actions.ts`.

### 1) Retorno do `updateOrganizationAction`
Arquivo: `src/app/(app)/(pessoas)/organizacoes/actions.ts`

- Atualizei a assinatura:
  - de `Promise<ActionResult<{ organizationId: number } | undefined>>`
  - para `Promise<ActionResult<{ organizationId: number }>>`
- No sucesso, agora retorna:
  - `return { success: true, data: { organizationId } };`

---

### 2) Extração dos helpers duplicados
Criei um módulo compartilhado:

- `src/lib/form-data.ts`
  - `toStr`
  - `toRawString`
  - `toOptionalNumber`

E passei a importar nos dois arquivos:

- `src/app/(app)/(pessoas)/pessoas/actions.ts`
- `src/app/(app)/(pessoas)/organizacoes/actions.ts`

Também removi as implementações locais duplicadas dos dois arquivos.

---

### 3) Contrato da validação em Organizations
Arquivo: `src/app/(app)/(pessoas)/organizacoes/actions.ts`

- `validateOrganizationFormData` agora segue o mesmo padrão de `validatePersonFormData`:
  - retorna união tipada com:
    - sucesso: `{ success: true, data: { values: ... } }`
    - erro: `{ success: false, message: string }`
- `createOrganizationAction` e `updateOrganizationAction` foram ajustadas para consumir `validation.message` e `validation.data.values`.

---

### Verificação
- Sem erros de lint via diagnóstico (`ReadLints`) nos arquivos alterados.
- Não rodei `pnpm lint`/`pnpm build` (mantendo seu fluxo).

---

**User**

Mova o parseJson para o form-data.ts também. Pode ser útil para reutilizar em outros lugares futuramente.

---

**Cursor**

Perfeito — vou mover `parseJson` para `src/lib/form-data.ts` e atualizar o `pessoas/actions.ts` para importar dele, removendo a implementação local.

Feito. `parseJson` foi movido para `src/lib/form-data.ts` e o `pessoas/actions.ts` agora importa esse helper do módulo compartilhado.

### Alterações
- `src/lib/form-data.ts`
  - adicionado `export function parseJson<T>(...)`
- `src/app/(app)/(pessoas)/pessoas/actions.ts`
  - import atualizado para incluir `parseJson`
  - removida a implementação local duplicada de `parseJson`

Sem erros de lint nos arquivos alterados.

