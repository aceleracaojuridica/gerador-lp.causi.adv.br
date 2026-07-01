Preciso corrigir um problema na implementação do account-switching.

## Contexto:
- Doc da implementação completa do session-context do usuário + account-switching: #file:session-context.md 
- Indice de documentos para você ler e identificar arquivos relevantes pra gerar esse plano: #file:README.md 
- Passei também toda pasta da change gerada pelo openspec que foi usado para implementar essa funcionalidade no projeto.

## Problema:
Quando eu troco o context, deve atualizar o session do user com o novo context, e com isso deve atualizar a página ou dar fetch novamente, enfim. Por exemplo, to na pagina debug para testar. Quando eu troco o account, não reflete as alterações no json, ele continua sempre puxando a minha conta principal.

A função RPC ela recebe por parametro um account_id, se for vazio, ele puxa o main account do usuário. Agora se for passado um parametro, puxa a conta passada por parametro pro contexto, mas lá dentro da lógica dela tem função que verifica se o usuário consegue puxar aquela conta.

O dropdown que lista contas ta estranho também. Quando troco de conta com um usuario com acesso a contas adicionais, ele mostra uma lista de contas, exceto a que está selecionada. E quando seleciono outra conta, ele muda o selected, mas ai quando abro novamente o select, ele mostra a conta adicional (que está atualmente selecionada), em vez de mostrar a outra que o usuário tem acesso.

Outro detalhe do dropdown, é que ele deve listar todas contas, mesmo a que já está selecionada, e marcar que está selecionada ao invés de retirar do dropdown (se selecionar a mesma conta não troca o contexto).

E, acho que seria bom também ter uma busca de contas, quando não é super admin, mesmo que tenham poucas, ele pode ter seila, tipo umas 10 contas e precisar de uma busca, mesmo que seja local.

E outro exemplo. Atualmente não está implementado outras páginas, mas se eu implemento a página pessoas por exemplo. Ai estou listando as pessoas de uma conta. Ai eu troco o contexto com account-switching, ele deve atualizar os dados da página pra pegar as pessoas da conta que acabou de ser selecionada.

--- 

Talvez seria bom salvar esse cookie mesmo que o usuário não troque de conta após o login pra manter o registro da conta usada atualmente? E ai esse cookie deve ser limpo quando o usuário não está mais autenticado. E detalhe, se ele trocar de conta, mesmo que ele volte depois e ainda esteja logado, ou de um f5 na página, deve manter o contexto da conta que ele tinha selecionado, só reseta pra principal se der algum problema na hora de carregar a RPC ou ele deslogar, ou o cookie expirar ou for deletado.