# Changelog

## Atualização geral do Gerador de Landing Pages

Este changelog consolida as alterações registradas em `reviews/`, com linguagem simples para toda a equipe.

## O que foi entregue

### 1) Segurança e controle de acesso
- O acesso ao gerador agora valida plano ativo de Landing Pages antes de liberar páginas e ações.
- Foram criados guardas de sessão para separar claramente casos de "não autenticado" e "sem permissão".
- Fluxos críticos passaram a retornar erros mais claros para o usuário (ex.: acesso negado por plano).

### 2) Sessão e integração com Causi
- A sessão deixou de usar permissões fixas e passou a buscar dados reais de conta/plano via RPC do Causi.
- A autorização ficou mais confiável porque usa informações reais de assinatura e features.
- Em `src/lib/session/get-session.ts`, a função `getSession()` deixou de montar `features` fixas e passou a consultar a RPC `get_current_user_details_v4`, retornando conta ativa, assinatura, plano e features reais do Causi.
- Em `src/lib/session/types.ts`, o tipo `Session` foi expandido com `plan` e `features`, permitindo que a autorização use dados tipados de billing em vez de suposições no frontend.
- Em `src/lib/session/access.ts`, foram centralizados `LP_PLAN_ID` e `hasLpAccess(session)`, definindo em um único ponto a regra de acesso ao produto de Landing Pages.
- Em `src/lib/session/require-session.ts`, as funções `requireLpAccess()` (para páginas/server components) e `requireLpSession()` (para actions/handlers) padronizaram bloqueio e retorno de erro para cenários de autenticação/permissão.

### 3) Backend mais consistente (Server Actions)
- Operações de salvar/excluir landing page e salvar configurações foram movidas para Server Actions.
- Rotas internas antigas de CRUD foram removidas onde não faziam mais sentido.
- Com isso, houve melhora em tipagem de retorno, mensagens de erro e atualização de tela (revalidate).
- Operações de configuração e LP foram centralizadas em `src/app/actions/config.ts` (`getConfigAction`, `saveConfigAction`) e `src/app/actions/lps.ts` (`saveLpAction`, `deleteLpAction`), removendo lógica espalhada em chamadas `fetch` no cliente.
- As rotas internas antigas de CRUD em `src/app/api/config/route.ts`, `src/app/api/lps/save/route.ts` e `src/app/api/lps/delete/route.ts` foram removidas, mantendo o backend com menos superfícies de autorização duplicadas.
- As actions passaram a validar acesso via `requireLpSession()` antes de persistir, e usam retorno tipado (`ActionResult`) para padronizar mensagens de erro nos componentes.
- Em `src/app/actions/lps.ts`, após exclusão/salvamento, foi aplicado `revalidatePath("/")`, reduzindo dependência de refresh manual e deixando a galeria sincronizada com o estado do servidor.

### 4) Evolução de banco e estrutura de dados
- As migrations em `supabase/migrations` formalizaram o estado legado (profiles, leads, user_settings) e criaram a tabela final de `landing_pages`, com `slug` único global, `status` (`draft/published`), `template_id`, `published_at` e trilha completa de timestamps.
- Foram removidas estruturas antigas como `lps`, `leads_gerador`, coluna `profiles.pages` e espelhos de usuário locais, migrando os dados para o novo modelo e deixando o Projeto B documentado em SQL em vez de “schema oculto” só no banco.
- A base também foi preparada para a galeria e governança de imagens (bucket `gerador-lp-assets`, catálogo por conta e pontos de uso), o que é a fundação para RLS real por conta e para as novas regras de propriedade/uso descritas nos reviews de RLS + galeria.

### 5) Melhorias no editor e experiência de uso
- O editor ganhou melhorias de navegação e organização de fluxo para reduzir confusão entre modos.
- Recursos importantes passaram a ter maior visibilidade no fluxo de edição (com foco em previsibilidade).
- Houve ajustes de validação no formulário de criação para evitar dados inválidos (WhatsApp/e-mail e campos condicionais).

### 6) Mídia e imagens
- Foi criada base para governança de imagens com foco em reutilização e menos duplicação.
- Fluxos de seleção de imagem foram melhorados para aumentar variedade e reduzir repetição automática.
- Ajustes em integrações de imagem (Unsplash e prioridades de fonte) melhoraram relevância visual.
- Em `supabase/migrations/20260629160000_gerador_lp_storage_bucket.sql`, foi formalizado o bucket `gerador-lp-assets` com regras de arquivo (tipos/limite) e estrutura de paths por LP, criando base operacional para centralizar mídia em vez de uploads dispersos.
- Em `src/lib/landing-pages/unsplash.ts`, a lógica de busca deixou de ficar presa sempre no primeiro resultado: funções de busca passaram a considerar múltiplos resultados e seleção variável por contexto, reduzindo repetição de imagem entre seções e entre LPs.
- Em `src/app/api/gerar-copy/route.ts`, o preenchimento de imagens por slot foi ajustado para não repetir automaticamente a mesma imagem quando a galeria tem poucos itens; quando necessário, o fluxo faz fallback para outras fontes em ordem de prioridade.
- Em `src/app/api/imagem/route.ts`, o fluxo do botão "IA escolhe" foi refinado para evitar retornar a imagem atual do slot e melhorar distribuição por seção, além de fallback controlado quando não há candidato adequado.
- Em `src/lib/landing-pages/lp-generate-copy.ts`, as `imageQueries` foram refinadas para contexto semântico jurídico (menos termos genéricos), melhorando a aderência das imagens sugeridas ao conteúdo real da landing page.
- No desenho geral documentado em `reviews/003-rls_lp_e_galeria_fb8a9fb7.md` e `reviews/005-images.md`, foi definida a arquitetura de galeria por conta com rastreio de uso de imagem por LP, preparando regras de reutilização, bloqueio de exclusão quando em uso e redução de duplicação no storage.

### 7) Layout e navegação da aplicação
- Foi adicionado layout global com sidebar compartilhada para reduzir duplicação e inconsistência entre páginas.
- Configurações globais ficaram melhor integradas à navegação principal.

### 8) Documentação técnica
- Documentação de schema e contexto de banco foi atualizada para refletir melhor a arquitetura atual.
- Estruturas antigas de referência foram removidas para reduzir ambiguidade no onboarding técnico.

### 9) Scripts e iframes embed (Calendar, Maps, YouTube)
- O escopo de segurança para HTML/scripts customizados foi formalizado em `reviews/007-scripts-html.md`, com validação por allow-list de domínios confiáveis e bloqueio de padrões perigosos (ex.: inline script com comportamento de exfiltração).
- O desenho técnico separou script livre de embed estruturado: em vez de salvar iframe bruto, a proposta define extração de `src`, validação de domínio e reconstrução segura do iframe para Google Calendar, Google Maps e YouTube.
- Foram mapeados os pontos de implementação por arquivo para essa frente: validações em schemas (`src/forms/GlobalConfigForm/schema.ts`, `src/lib/landing-pages/validation/zod-primitives.ts`), utilitários de validação/extrator, painéis de editor (`src/components/Builder/editor/panels/*`) e renderização no preview (`src/components/Preview/landing-preview.tsx`).
- Também foi especificado o impacto de UX esperado: erro inline quando script/embed for inválido, preview mais previsível no editor e menor risco de publicação com código de terceiros não autorizado.

### 10) Considerações estruturais e de contexto (reviews `index.md` e `001-review-geral-da-aplicação.md`)
- O gerador opera com dois projetos Supabase distintos: Projeto A (Causi: auth, billing, contas) e Projeto B (Gerador: LPs, leads e configurações). O changelog passa a explicitar que cada operação foi ajustada para usar o cliente correto em cada banco.
- A autorização de plano foi movida para dados reais do Causi (RPC de sessão), enquanto persistência do gerador segue no Projeto B. Esse recorte foi uma decisão arquitetural para reduzir inconsistências entre "plano local" e "plano real".
- A transição de `Route Handlers` para `Server Actions` não foi total: `src/app/api/gerar-lp/route.ts` permanece como handler por ser operação longa de geração (timeout/streaming), conforme apontado no review técnico.
- A configuração global foi corrigida no ponto mais crítico de acoplamento: `src/lib/config.ts` saiu da tabela/cliente antigos (`user_config` via cliente de sessão do Causi) para leitura/gravação em `user_settings` com cliente do Projeto B.
- A leitura de leads no dashboard também foi corrigida para consulta direta no Projeto B por `causi_user_id`, removendo dependência frágil de subdomínio como chave indireta de busca.
- O objetivo macro da refatoração, consolidado no `reviews/index.md`, foi transformar o gerador de "editor com preview" em módulo de produto com ciclo de vida governado (autoria, status, publicação, mídia e regras de acesso).

## Impacto para Marketing
- Mais confiança para publicar LPs com qualidade e consistência.
- Menos risco de páginas com contato inválido ou experiência visual repetitiva.
- Base melhor para evoluir SEO, preview de compartilhamento e integrações de conversão.
- Melhor governança de mídia, facilitando reaproveitamento de imagens e escala de campanhas.

## Impacto para Desenvolvimento
- Menos lógica espalhada de autorização e menos dependência de regras manuais no frontend.
- Fluxos críticos mais testáveis e previsíveis com Server Actions e tipagem explícita.
- Modelo de dados mais claro para evoluir publicação, permissões e observabilidade.
- Arquitetura mais alinhada ao padrão do Causi v2, reduzindo custo de manutenção.

## Itens em andamento ou próximos passos mapeados nos reviews
- Concluir validações fim a fim do fluxo completo de criação/publicação (E2E).
- Finalizar o endurecimento de RLS por conta e galeria com regras completas de propriedade/uso.
- Fechar melhorias pendentes de editor (SEO avançado, template pós-criação, embeds e UX adicional).
- Consolidar mensagens de erro/toasts por permissão para todos os cenários.
- Validar e fechar as pendências operacionais destacadas em review: `.env.local.example` removido com referência ainda ativa no README, endpoint público de captura de leads não consolidado, middleware sem validação de plano (bloqueio hoje está no handler), botão "Ajuda" sem ação e módulo de editor ainda monolítico para evolução incremental.
