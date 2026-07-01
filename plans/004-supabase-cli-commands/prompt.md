Estou com algumas dúvidas em relação a comandos do Supabase nesse projeto. No meu package.json tenho alguns scripts que usam db:pull, db:link, porém acredito que como tenho algumas rules e skills que usam o comando padrão supabase link, supabase pull e etc, vai ficar meio despadronizado. Então talvez seria melhor o projeto inteiro usar os comandos igual aparece no CLI do Supabase em vez de traduzir a partir de um script, pra manter um padrão consistente e ficar evidente que o projeto usa Supabase.

Você deve verificar se as alterações e questionamentos feitos aqui fazem sentido, e qual melhor forma de prosseguir. Lembrando que o projeto usa uma metodologia AI Driven Development, que a IA é capaz de ler a documentação e executar as tarefas, propor comandos para executar e qual melhor forma de fazer algo seguindo as orientações e dúvidas do dev.

## Dúvida 1

Tem alguma vantagem de usar esses scripts dessa forma ou que justifique o uso?

Caso não: Gostaria que padronizasse em todo projeto o uso dos comandos do Supabase diretamente, onde tiver qualquer referencia a esses scripts pode alterar.
Caso sim: justifique e proponha algum tipo de padronização para esses comandos.

## Dúvida 2

Quando é necessário o uso do --linked nos comandos?

Meu ciclo atual de desenvolvimento é:
- Tenho 2 projetos no Supabase (Cloud) um é de prod, e outro develop. Normalmente eu troco entre os projetos usando o comando link e passando o project-ref, que normalmente em qualquer branch usa o projeto de develop exceto na main, que usa o projeto prod para aplicar qualquer mudança.
- Atualmente uso declarative database schemas, porém acredito que precisa corrigir alguns comandos de diff no meio da documentação, pois atualmente se rodar só o diff sem pedir pra gerar uma migration em um arquivo, não vai ser gerado a migration correspondente, só vai mostrar as diffs no cli.
- Tenho dúvida se o diff deve ser gerado com ou sem o --linked.

## Refêrencias e observações

Referências para você entender mais sobre o ciclo de desenvolvimento do Supabase:
- https://supabase.com/docs/reference/cli/introduction
- https://supabase.com/docs/guides/local-development/declarative-database-schemas
- https://supabase.com/blog/the-vibe-coders-guide-to-supabase-environments

Observações:
- No projeto em algumas partes dizem que não deve gerar migrations manualmente pois já é gerado com diff, mas no documento que fala sobre declarative-schemas que está em anexo, fala que tem alguns casos que pode ser necessário gerar manualmente. Então verifique qual seria o ciclo recomendado, acho que normalmente o diff funciona muito bem, mas pode necessitar de revisão manual no arquivo pra ver se foi gerado tudo que foi pedido.
- Você pode ler as pastas e arquivos necessários nessa tarefa para entender melhor o projeto.