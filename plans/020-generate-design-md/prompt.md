Análise os seguintes arquivos e seus componentes: 
- @src/components/ui-patterns @src/components/ui 
- @src/app/layout.tsx @src/components/system-bar.tsx @src/components/app-sidebar.tsx 
- @src/app/(app)/(pessoas)/pessoas/columns.tsx @src/app/(app)/(pessoas)/pessoas/data-table.tsx @src/app/(app)/(pessoas)/pessoas/page.client.tsx
- @src/forms/PersonForm/person-form.tsx @src/forms/OrganizationForm/organization-form.tsx 
- @src/app/globals.css 

Com base neles, gere um arquivo `DESIGN.md` dentro de `/docs/design` documentando o design system do projeto. Utilize a skill /design-md ignorando a parte do uso do Google Stitch, preciso apenas que gere o arquivo .md baseado no estilo e padrão atual dos componentes e páginas.

**Exemplos de DESIGN.md:**
- @plans/020-generate-design-md/DESIGN.linear.md 
- @plans/020-generate-design-md/DESIGN.supabase.md 
- @plans/020-generate-design-md/DESIGN.vercel.md 

**Observações:**
- Remover as referências a cores HEX, quando for se referir a uma cor apenas coloque o nome do token. A consulta final de cores deve ser feita no arquivo `globals.css`.
- Algumas cores na prática usam opacidade através do tailwind como por exemplo `bg-primary/20`.
- Os arquivos enviados são fonte de referência geral para o projeto, então quando for descrever estilo de forms por exemplo, não é para especificar "Form (Pessoas/Organizações)", é o estilo padrão de forms do projeto.
- Não considerar o uso da fonte "DM_Serif_Display" no projeto (presente em layout.tsx).
- Caso não seja possível documentar alguma especificação/componente por falta de referencia nos arquivos, deixe uma nota de TODO (será revisado futuramente quando houver exemplos prontos para essa especificação).