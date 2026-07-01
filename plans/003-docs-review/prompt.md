## Objetivo

Revisar e corrigir a documentação do projeto. Separe esta tarefa em subtarefas para facilitar a organização e execução.

**Documentação do projeto:** Em @docs/README.md possui o índice completo da documentação (usado tanto para humanos quanto para a IA)
**Rules IA**: Em @.agents/rules/ estão algumas regras para os agentes de IA. Deve ser comparado com a documentação atual para verificar se há necessidade de ajustes ou centralização das informações em `docs/`.

## Pré-analise

### Geral

- Usamos pnpm, então acredito que vários comandos não estão alinhados a isso, instruindo a utilizar `npx` ao invés do equivalente em `pnpm`. Tenho dúvidas se o certo é usar `pnpx` ou `pnpm exec` ou `pnpm dlx` para os comandos, ou se é recomendado usar `npx` mesmo com pnpm, então vale a pena verificar isso.

### docs\ai-context\

- Talvez renomear ou agrupar os docs dessa pasta em outra, pois os docs lá dentro não são exclusivos para o contexo de IA. E na realidade toda documentação pode ser utilizada para contexto de IA, principalmente o `docs/README.md` que é o índice completo da documentação.

### docs\ai-context\conventions.md e docs\components\overview.md

- Verificar se as convenções de nomenclatura e estrutura estão alinhadas com a estrutura atual do projeto. Por exemplo, se a convenção de arquivos de componentes estruturados está sendo seguida no projeto, ou se há divergências que precisam ser corrigidas.
- Verificar se as convenções são consistentes com regras semelhantes em outros arquivos.

### docs\ai-context\project-summary.md

- Separar a stack em lista para melhor legibilidade.
- Em "banco", alterar os nomes para inglês (ex: "contas" para "accounts", "usuários" para "users", etc.) para manter consistência com os nomes de tabelas e arquivos do projeto.
- Verificar se há necessidade de inserir dados atuais de roles, permissões, planos e valores diretamente nesse arquivo, já que a fonte de verdade para esses dados fica em `/docs/references/`
- Revisar esse documento, pois acredito que o `docs/README.md` hoje seja o arquivo mais importante para inserir em qualquer IA e ela mesmo acessar o que for necessário de acordo com esse índice (verificar se isso faz sentido).

### docs\api\routes.md e docs\architecture\auth.md

- Verificar se as rotas/estrutura de pastas listadas estão atualizadas e refletem a estrutura atual do projeto.
- Verificar se funções RPC existem, no caso `validate_account_invitation` mencionada em `docs/architecture/auth.md` não existe, o correto é `is_valid_invite_for_user`, que pode ser consultada em `docs/database/functions.md`. Verificar se há outras menções a funções que não existem ou estão com nome diferente.

### docs\architecture\integrations.md

- Em "Fluxo de processamento" falta uma parte, aonde diz "Enfileirar", na verdade após persistir a mensagem, a Edge Function envia uma requisição pra um endpoint do N8N para ativar um fluxo de Agente de IA, lá dentro é recebido todas informações dessa conta, conversa, e mensagem, a partir disso dentro do fluxo é criado a fila de mensagens. Acredito que atualmente na documentação não tem nada dizendo sobre como funcionam os agentes de IA, mas atualmente são workflows dentro do N8N que são ativados por requisições das Edge Functions.
- Atualmente também tem uma integração dentro do app que é para transcrição de áudios, que é feito diretamente com uma requsição para API da OpenAI, acredito que seria interessante criar uma seção de "Integrações de IA" ou algo do tipo para falar sobre isso, já que é algo que tem bastante relação com o assunto de integrações e pode ser algo que seja expandido no futuro.

### docs\architecture\overview.md

- Talvez seja melhor não utilizar `SERVICE_ROLE_KEY` para acesso de Super Admin (verificar se isso faz sentido), pois já existe RLS que permite acesso total ao banco de dados para Super Admins, e o uso de `SERVICE_ROLE_KEY` pode representar um risco de segurança se não for gerenciado corretamente. A maioria das Edge Functions usam `SERVICE_ROLE_KEY` pois algumas são executadas por webhooks de integrações e não é possível verificar a identidade de um usuário.
- No "Realtime e Sincronização" da um exemplo da tabela `messages`, mas a coluna `account_id` não existe nessa tabela, e no exemplo usa: filter: `account_id=eq.${accountId}`. O correto seria `conversation_id` para se inscrever nas mensagens de uma conversa especifica. Ou se for para atualizar a lista de conversas quando chega uma nova mensagem, pode utilizar a tabela `conversations` e filtrar por `account_id` para atualizar a lista de conversas quando chega uma nova mensagem em qualquer conversa daquela conta. Pois existe um trigger que ao chegar uma nova mensagem de uma conversa, é atualizado a coluna `last_message_at` da tabela `conversations`.
- Verificar se as rotas/estrutura de pastas listadas estão atualizadas e refletem a estrutura atual do projeto.

### docs\database\overview.md

- Talvez seja melhor não utilizar `SERVICE_ROLE_KEY` para acesso de Super Admin (verificar se isso faz sentido), pois já existe RLS que permite acesso total ao banco de dados para Super Admins, e o uso de `SERVICE_ROLE_KEY` pode representar um risco de segurança se não for gerenciado corretamente. A maioria das Edge Functions usam `SERVICE_ROLE_KEY` pois algumas são executadas por webhooks de integrações e não é possível verificar a identidade de um usuário.
- Revisar toda parte "Supabase CLI", parece que os comandos estão configurados dentro de `package.json` então revise ele. Notei que dentro do package.json tem um comando que não existe do CLI, e todos comandos usam --linked, não sei se esse é o padrão recomendável para desenvolvimento. Você pode consultar alguns guias do supabase nesses links:
  - https://supabase.com/docs/reference/cli/
  - https://supabase.com/docs/guides/local-development/declarative-database-schemas
  - https://supabase.com/docs/guides/deployment/managing-environments
- Alias, acho que na documentação não deixa claro, mas está sendo utilizado declarative-database-schemas dentro de `supabase/schemas`, então o ideal seria todas mudanças alteraram o arquivo .sql dentro dessa pasta e usar o supabase diff para gerar a migration, e não editar diretamente as migrations, pois elas são geradas automaticamente a partir dos arquivos de schema. Verificar se isso está claro na documentação, e se os comandos estão corretos para esse fluxo de trabalho.
- Além disso também verifique o uso do comando npx, pois acredito que o correto seria utilizar pnpx.
- Tenho uma dúvida também sobre como gerenciar o project-ref na hora de executar o comando de db link. Pois em nenhum lugar tenho salvo o project-ref, ele é inserido sempre manualmente no comando CLI, tem como deixar isso salvo em algum lugar, ou é melhor gerenciar manualmente? Pelo que vi tem uma pasta .temp dentro de supabase, que tem um project-ref, que tem o ID do ultimo projeto linkado, isso é o correto pra usar?
- Atualmente tenho dois ambientes no supabase, tenho o projeto de produção, e  o de desenvolvimento, e o de desenvolvimento atualmente está usando o mesmo schema do de produção. O fluxo ideal para o projeto atual é que nas branchs de desenvolvimento seja utilizado o projeto de desenvolvimento, e na branch main seja utilizado o projeto de produção. Atualmente o .env possui as chaves do ambiente de desenvolvimento, e na main usa as chaves do ambiente de produção. Acredito que isso não esteja documentado.

### docs\database\rls.md

- "DELETE" está descrito como "Geralmente restrito a super admins ou fluxos específicos", mas a maioria das tabelas tem políticas que permitem DELETE para usuários comuns, desde que eles tenham a permissão necessária.

### docs\database\schema-classroom.md e docs\database\views.md

- É mencionado que a view `lessons_view` retorna uma coluna `is_locked` mas isso não está certo. Consulte a view mencionada e veja como funciona. Essa view é configurada como security definir pois as RLS bloqueiam o acesso aos conteúdos de aula premium, porém o usuário com acesso ao plano classroom padrão deve ter acesso aos metadados básicos da aula, pois no frontend é listado as aulas, porém aparece um bloqueio para aulas premium. Então a view libera condicionalmente o acesso as colunas `content` e `video_url`.

### docs\database\schema-public.md

- A tabela `messages_queue` atualmente é utilizado apenas pelo N8N, as Edge Functions enviam para workflows de IA dentro do n8n, e lá dentro tem um node do Supabase que registra a mensagem nessa tabela.

### docs\decisions\adr.md

- Neste documento em "ADR-004" diz que "Autenticação por Convite (sem signup público geral)", apesar de dizer depois que existe cadastro aberto para plano educacional. Porém isso pode gerar uma confusão, dando a entender que está configurado para não aceitar cadastro público. O endpoint de cadastro público é gerenciado pelo Supabase, e atualmente está habilitado. A única restrição atual é que o ao se cadastrar a pessoa é inserida diretamente no plano educacional, e não existe possibilidade de cadastrar com trial por agora.
- A justificativa do "ADR-005" deve ser melhorada, pois o motivo principal é para que usuários possam visualizar apenas dados relacionados a sua conta ou contas adicionais às quais têm acesso.
- No "ADR-007" talvez seja necessário especificar o uso do declarative-database-schemas, para deixar claro que as alterações devem ser feitas nos arquivos de schema e não diretamente nas migrations, e que as migrations são geradas automaticamente a partir dos arquivos de schema.

### docs\decisions\prd.md

- Aqui afirma "Demais usuários entram por convite (fluxo via `account_invitations`)", porém essa tabela só é usada para usuários convidados a entrar em uma conta já existente. Exemplo: um escritório tem uma conta no Causi, e ele precisa adicionar um usuário dentro da conta.
- Verificar se a rota de auth está correta de acordo com as rotas atuais do projeto em `src/`.

### docs\design\overview.md

- Revisar as informações contidas aqui, pois acredito que a única fonte usada atualmente é a Inter, as outras nem são usadas (e nem devem ser usadas).

### docs\guides\frontend-guide.md

- Esse arquivo foi enviado recentemente por um dev do projeto com informações mais atualizadas, porém precisam de revisão também. Uma adição importante aqui foi o Husky. Verificar se ele precisa existir ou já está coberto por outros arquivos na documentação.

### docs\guides\nextjs.md e .agents\rules\nextjs-structure.md

- Revisar o arquivo e também verificar se precisa dele. Atualmente no projeto tem um arquivo AGENTS.md que tem uma seção "ALWAYS read docs before coding" para Next.js que indica o caminho `node_modules/next/dist/docs/` com a documentação atual. Isso foi inserido na própria inicialização do Next.js, por padrão eles incluem essa regra e toda documentação do Next.js nessa pasta, conforme dito aqui: https://nextjs.org/docs/app/guides/ai-agents

### docs\guides\shadcn.md e .agents\rules\shadcn.md

- Revisar e verificar se ambos precisam existir, ou se as informações estão dispersar e repetidas em vários arquivos. Também tem menções do shadcn em `docs\design\overview.md`.

### docs\references\roles-and-permissions.md

- Acho que faltou incluir em "Como as Permissões são Verificadas" uma menção a função RPC `is_super_admin(uid)` (verificar se faz sentido ou se deixa apenas nos outros arquivos os detalhes).

## Tarefas

### Fase 1 - Planejamento
1. Ler a documentação do projeto + pré análise.
2. Identificar inconsistências e erros na documentação cruzando com arquivos semelhantes e a estrutura de pastas/arquivos atuais do projeto.
3. Sugerir correções e melhorias para a documentação, garantindo que ela esteja clara, precisa e atualizada.
4. Salvar o plano com toda lógica de implementação da correção e melhorias sugeridas em `plans/docs-review/implementation-plan.md`.

### Fase 2 - Implementação
1. Implementar as correções e melhorias sugeridas na documentação.

**Importante:** 
- Você só pode corrigir a documentação em `docs/` e `.agents/rules/`, não pode alterar o código do projeto dentro do diretório `src/`.
- A pré análise é apenas um guia para te ajudar a identificar possíveis pontos de melhoria, mas sinta-se livre para explorar toda a documentação e encontrar outros pontos que possam ser corrigidos ou melhorados.