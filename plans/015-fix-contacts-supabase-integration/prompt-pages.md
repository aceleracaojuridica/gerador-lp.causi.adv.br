## Correções

A implementação já foi feita e foram finalizadas todas as tasks, porém tem alguns bugs e coisas a serem corrigidas. Como as páginas `/pessoas` e `/organizacoes` foram implementadas com a mesma lógica deve aplicar as mesmas correções para os dois.

### Listagem

1. A ordenação padrão atual ta sendo `name` ASC.
    - Esperado: A ordenação padrão deve ser `created_at` DESC.

2. Ao clicar na row não abre form de edição, o form só abre ao abrir o menu de ações e clicar em `Editar`. 
    - Esperado: Abrir o form de edição tanto ao clicar na row quanto ao clicar em `Editar` no menu de ações. Corrigir possíveis conflitos de eventos de clique pois o menu de ações fica dentro da row.

3. A coluna `Criado em` atualmente mostra a data assim "2026-04-30T17:41:41.453524+00:00" (valor salvo no banco) 
    - Esperado: Formato "06/03/2026 15:17" (dia/mes/ano hora24h:minuto) para exibição.

4. O botão de resetar filtros no "Empty State" está resetando sort e order.
    - Esperado: O botão de resetar filtros deve resetar apenas os filtros (search, organization), e manter a ordenação atual (sort e order).

5. A busca atual está adicionando sort e order na URL.
    - Esperado: A busca deve apenas adicionar o parâmetro `search` na URL, e manter a ordenação atual (sort e order) se houver.
    - Exemplo: `/pessoas` após search `/pessoas?search=lucas` | `/pessoas?sort=name&order=asc` após search `/pessoas?sort=name&order=asc&search=lucas`