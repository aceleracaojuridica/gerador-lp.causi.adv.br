Status: approved for implementation


## Plan: Dialog Overlay Container

Resolver de forma centralizada o problema de combobox/popover/select dentro de dialog sem depender de props por uso. A abordagem recomendada e mais prática é fazer o Dialog expor seu container via contexto React e fazer os wrappers de overlay consumirem esse container automaticamente como destino do portal. Isso preserva o comportamento modal do Dialog, elimina o opt-in manual e reaproveita a correção para Combobox, Popover e Select.

**Steps**
1. Fase 1 — Centralizar o container do dialog
   - Adicionar uma pequena infraestrutura de contexto para expor o elemento real de `DialogContent` aos descendentes React.
   - Ajustar `DialogContent` para registrar seu elemento DOM e fornecer esse valor aos filhos sem alterar sua API pública principal.
   - Definir um fallback nulo para manter overlays fora de dialog portalando normalmente para `document.body`.
2. Fase 2 — Ensinar os wrappers de overlay a consumir o container
   - Atualizar `ComboboxContent` para usar o container vindo do contexto quando a prop `container` não for fornecida explicitamente.
   - Atualizar `PopoverContent` da mesma forma, encaminhando `container` ao `PopoverPrimitive.Portal`.
   - Atualizar `SelectContent` da mesma forma, encaminhando `container` ao `SelectPrimitive.Portal`.
   - Manter a prop `container` opcional como override explícito para casos especiais, mas deixar de depender dela para o caso comum dentro de dialog.
3. Fase 3 — Remover workarounds locais e alinhar componentes afetados
   - Simplificar `EntityCombobox`, removendo a lógica local baseada em `modal`, `rootRef`, `closest()` e `portalContainer`, já que `ComboboxContent` passará a se resolver sozinho dentro do dialog.
   - Revisar se a prop `modal` de `EntityCombobox` deve ser removida ou mantida apenas por compatibilidade temporária. Recomendação: manter temporariamente sem necessidade prática e limpar call sites nesta mesma etapa.
   - Validar `SearchableSelect`, que depende de `PopoverContent`, para garantir que passe a funcionar automaticamente dentro de dialog sem qualquer prop adicional.
   - Validar `PhoneInput` / `CountrySelect`, que depende de `ComboboxContent`, para garantir que o seletor de país herde a correção automaticamente dentro de dialog.
   - Revisar `MultiSelect`: a prop `modalPopover` não resolve o problema de portal por si só; decidir se ela continua existindo apenas para semântica modal do popover, sem ser tratada como workaround para dialog.
4. Fase 4 — Limpeza de usos conhecidos
   - Remover usos de `modal` atualmente adicionados apenas para contornar o problema de dialog, começando pelos formulários já identificados.
   - Procurar usos de `PopoverContent`, `SelectContent`, `ComboboxContent` em formulários modais e confirmar que a correção passa a ser automática.
   - Limitar esta primeira entrega a `Dialog`, mas estruturar a solução para futura extensão a outras superfícies modais se o projeto introduzir wrappers equivalentes.
5. Fase 5 — Verificação
   - Verificar manualmente os cenários que hoje quebram: clique em item, scroll da lista e foco no input de busca dentro de dialog.
   - Rodar verificação de tipo/lint do projeto para garantir que a mudança nos wrappers não quebre a API existente.
   - Fazer uma checagem de regressão fora de dialogs para confirmar que overlays continuam funcionando normalmente quando portalados para `body`.

**Relevant files**
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\dialog.tsx` — ponto ideal para fornecer o container modal aos descendentes; hoje já define o boundary com `data-slot="dialog-content"`.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\combobox.tsx` — `ComboboxContent` já aceita `container`; deve passar a usar contexto como fallback automático.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\popover.tsx` — `PopoverContent` atualmente sempre portaliza para `body`; precisa passar a aceitar e consumir container automático.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\select.tsx` — `SelectContent` hoje também portaliza para `body`; precisa do mesmo fallback automático.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\entity-combobox.tsx` — contém o workaround atual com prop `modal`, `closest()` e estado local de `portalContainer`.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\searchable-select.tsx` — depende de `PopoverContent`; serve como caso representativo de correção sem prop extra.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\reui\phone-input.tsx` — depende de `ComboboxContent`; deve herdar a correção automaticamente no country picker.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\components\ui\multi-select.tsx` — revisar o papel real de `modalPopover` após a correção estrutural.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\PersonForm\person-form.tsx` — caso real já usando `EntityCombobox` com `modal`; bom cenário de validação e limpeza.
- `c:\Users\devbo\OneDrive\Documentos\Sites\causi-app\src\forms\TaskForm\task-form.tsx` — exemplo de `PopoverContent` dentro de formulário que pode aparecer em dialog.

**Verification**
1. Abrir um dialog com `EntityCombobox` e confirmar: o input de busca recebe foco, os itens podem ser clicados e a lista pode ser scrollada.
2. Abrir um dialog com `SearchableSelect` e confirmar os mesmos três comportamentos sem props extras.
3. Abrir um dialog com `PhoneInput` e validar o country picker com clique, scroll e foco funcionando.
4. Validar um `Select` nativo do wrapper dentro de dialog para confirmar que o portal automático também cobre Radix Select.
5. Revalidar os mesmos componentes fora de dialog para confirmar ausência de regressão.
6. Rodar `pnpm lint` e, se necessário, uma checagem adicional de tipos/erros no editor para garantir compatibilidade dos wrappers.

**Decisions**
- Escopo desta entrega: apenas `Dialog` por enquanto.
- Cobertura desta entrega: corrigir a base e ajustar componentes já afetados, não fazer uma varredura total em todos os call sites do projeto.
- Solução recomendada: contexto React partindo de `DialogContent` + consumo automático nos wrappers de overlay.
- Soluções descartadas como abordagem principal: desligar `modal` do dialog, afrouxar focus trap globalmente ou continuar exigindo props como `modal` em cada componente.

**Further Considerations**
1. Compatibilidade de API: vale decidir entre manter props como `EntityCombobox.modal` e `MultiSelect.modalPopover` por uma versão como compatibilidade suave ou removê-las imediatamente. Recomendação: manter temporariamente e retirar os usos internos primeiro.
2. Extensão futura: se surgirem `Sheet` ou `Drawer` customizados, a mesma infraestrutura pode ser generalizada mudando apenas quem fornece o container, sem alterar os overlays novamente.
3. Testes automatizados: se houver suite de componentes/RTL disponível, vale adicionar pelo menos um teste de integração que verifique que o conteúdo do overlay é portalado dentro de `DialogContent` em vez de `body`.