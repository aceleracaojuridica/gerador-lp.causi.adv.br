Preciso aprimorar a ideia do storage atual utilizado no projeto. Caso tenha alguma dúvida ou coisas ambíguas pode me fazer perguntas antes de gerar o plano completo.

## Problemas

- Não tem uma organização eficiente de pastas
- Não tem um padrão de convenção de nomes para arquivos
- Não tem como rastrear a qual conta / entidade do banco pertence um arquivo (apenas pela URL que está dentro de alguma entidade do banco)
- Não é possível configurar RLS de forma eficiente (atualmente um usuário logado pode fazer upload em qualquer pasta, qualquer arquivo)

## Ideias

- Além da organização de pasta o Supabase Storage permite armazenas metadados (não usado atualmente): "A opção de metadados é um objeto que permite armazenar informações adicionais sobre o arquivo. Essas informações podem ser usadas para filtrar e pesquisar arquivos. O objeto de metadados pode conter quaisquer pares de chave-valor que você desejar armazenar."

## Objetivo

- Propor soluções eficientes e escaláveis para os problemas apresentados e atualizar o documento atual `docs/database/storage.md`

## Limitações

- Não realizar nenhuma implementação no código, apenas atualizar a documentação que será usado em implementações/atualizações futuras

## Referências

- Contexto do projeto: #file:project-summary.md 
- Visão geral do banco de dados: #file:overview.md 
- Documentação do storage: #file:storage.md 
- Implementação do storage (parcial): #file:storage.md 