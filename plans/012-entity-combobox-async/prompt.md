**Contexto:** Revise os arquivos #file:entity-combobox.tsx , #file:combobox.tsx  e #file:system-bar.tsx  antes de qualquer alteração. Consulte também o `AGENTS.md` e a documentação necessária do projeto para entender convenções e padrões adotados.

**Tarefa:**

O `EntityCombobox` é o componente padrão do projeto para dropdowns de entidades do banco de dados (contatos, usuários, contas, etc). Ele deve ser refatorado para separar responsabilidades: o componente cuida apenas de UI e eventos, a lógica de fetch, cache e paginação fica em quem o utiliza.

**1. Refatorar o `EntityCombobox`**

O componente deve:
- Continuar recebendo `items` via prop para renderizar a lista
- Receber `isLoading` para exibir estado de carregamento
- Aplicar debounce internamente no campo de busca e emitir `onSearchChange(query)` já com o valor estabilizado. O delay é configurável via prop `debounce`, com padrão de 300ms
- Emitir `onScrollEnd()` quando o usuário chegar ao fim da lista, para permitir infinite scroll externamente
- Receber uma prop `hint` para exibir uma mensagem informativa na lista, como "Digite para encontrar mais resultados", útil quando infinite scroll não está ativo
- Não fazer fetch, não ter cache, não ter lógica de paginação

O modo estático atual — receber `items` e filtrar localmente — deve continuar funcionando para não quebrar usos existentes como #file:deals-create-form.tsx . Nenhuma alteração deve ser feita nesses usos.

**2. Criar um hook `useAccountSwitcher`**

Extrair toda a lógica atual do `SystemBar` para um hook dedicado, implementando as seguintes otimizações:

- **Fetch inicial:** ao abrir o dropdown, buscar os primeiros 30 itens ordenados pelo mais recente, junto com o `count` total, em um único fetch
- **Filtro local:** se `count <= itens retornados`, todos os dados já estão em memória — buscas via `onSearchChange` devem filtrar localmente sem nenhum fetch adicional. Nesse caso, passar uma `hint` indicando que não há mais resultados a buscar
- **Busca server-side:** se `count > itens retornados`, buscas via `onSearchChange` devem disparar fetch server-side com o termo digitado
- **Infinite scroll:** via `onScrollEnd`, habilitado para todos os usuários. Cada página carrega mais 30 itens acumulando na lista. Deve ser desabilitado quando não houver mais itens (`count` atingido) ou quando uma busca estiver ativa
- **Cache:** os resultados do fetch inicial ficam em memória por 5 minutos. Se o dropdown for fechado e reaberto dentro desse tempo, o fetch não é refeito. O cache é invalidado ao cadastrar uma nova conta
- **Troca de conta:** manter a lógica de `switchAccountAction` e atualização de sessão intactos

**3. Migrar o `SystemBar`**

Substituir o `Popover` + `Command` atual pelo `EntityCombobox` + `useAccountSwitcher`, mantendo o comportamento de troca de conta e atualização de sessão intactos.