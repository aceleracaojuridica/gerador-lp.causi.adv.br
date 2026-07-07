`c:\Users\bonaf\darlley\gerador-lp.causi.com.br\src\forms\GlobalConfigForm\sections\visual-config-form.tsx#L72-90` as configurações não devem permitir a alteração do dominio dos landing pages, o subdominio oficial é o nome do escritorio que é configurado pelo Causi no campo do nome do escritorio, apenas criamos um slug com o proprio nome escolhido pelo escritorio para gerar um subdominio.

A unica vez em que o subdominio aparece na URL é para o acesso via SLUG das landing pages:
-  o dashboard da aplicação é acessado em "causi.adv.br"/"localhost:3000"
- as landing pages são acessadas em "{SUBDOMAIN}.causi.adv.br/{SLUG}"/"{SUBDOMAIN}.localhost:3000/{SLUG}"

Então remova o campo do formulário e do banco de dados, ele não é sobrescrito, é uma informação externa que vive no banco de dados do proprio Causi. Ou deixe o aviso.

Encontrei o campo espalhado em três camadas: formulário global, esquema/persistência da configuração e UI do editor. Agora vou confirmar a origem no banco para remover só o que realmente pertence a este projeto. O campo também aparece no editor da LP, não só na configuração global. Vou verificar esse fluxo antes de editar para garantir que a remoção não deixe a URL pública ou o schema quebrados. A parte de banco está clara: o projeto ainda guarda custom_domain em lp_account_settings. Achei um detalhe importante: office.domain praticamente não participa mais da runtime. Hoje ele só serve como campo editável herdado por formulário, o que reforça que dá para cortar essa trilha sem afetar a URL pública baseada em officeSubdomain + slug.

Encontrei alterações locais já existentes em arquivos que eu precisaria tocar, incluindo src/forms/LpEditorForm/schema.ts , src/lib/landing-pages/schema.ts , src/lib/landing-pages/schema/types.ts e docs/features/landing-pages.md.

Pode seguir e editar por cima dessas mudanças, preservando tudo que já está no arquivo e fazendo só a remoção cirúrgica de domain/custom_domain .

1. Remover domain da configuração global da conta e da tabela lp_account_settings → verificar: leitura/gravação não referenciam mais custom_domain .
2. Remover a edição de domínio no editor e manter o subdomínio apenas como dado derivado/externo do Causi → verificar: nenhuma UI permite sobrescrever o host público.
3. Ajustar docs e validar TypeScript/lint nos arquivos tocados → verificar: diagnósticos limpos e sem referências funcionais ao campo removido.
---
Durante a criação de landing pages o formulário solicita a coonfiguração do nome do escritorio, devemos remover esta etapa por que o nome do escritorio é externo a aplciação, é uma informação que vive no banco de dados do Causi, podemos resgatar essa informação via Sessão do usuário autentiado.

C:\Users\bonaf\darlley\gerador-lp.causi.com.br\docs\database.md
C:\Users\bonaf\darlley\gerador-lp.causi.com.br\docs\features\authentication.md
C:\Users\bonaf\darlley\gerador-lp.causi.com.br\docs\features\rls.md
C:\Users\bonaf\darlley\gerador-lp.causi.com.br\src\forms\LandingPageCreateForm\landing-page-create-form.tsx (name)
---
Também não devemos persistir informações que se repetem em cada landing page, a melhor opção seria uma tabela separada para armazenar repetiveis (contatos,endereços, etc) que são uma forma de configuração global do usuário.

Apesar de ser uma confgiurações global, precisamos de novas tabelas para aplicar regras especificas.

Em C:\Users\bonaf\darlley\gerador-lp.causi.com.br\src\app\(app)\(configuracoes)\configuracoes o usuário pode configurar o endereço e informações de contato do escritorio de forma global que é utilizado em todas as landing pages.

Em br\src\forms\LandingPageCreateForm\landing-page-create-form.tsx, se a página de configurações com estas informações ja foram preenchidas então estas informações ja serão preenchidas por default.

No banco de dados as configurações de contato e endereços do escritorio devem ser persistidas em tabeals diferentes, as informações primarias (principais) recebem a flag is_primary boolean DEFAULT false NOT NULL:
- quando contatos|endereços|rede sociais é `is_primary=true` então sempre é utiliziado como valor pre-preenchido no formulário da criação de landing page e nos formulários respectivos das configurações globais
- quando contatos|endereços|rede sociais é `is_primary=false` então são endereços que podem ser utilizados em landign pages especificas mas não é uma configuração global. Sempre vão ser listadas durante a criação da landing page para melhorar a UX do usuário para evitar recriação de informações que ja foram preenchidas, mas o formulário de configuração global só mostra a opção padrão que esta em `is_primary=true`.

Devido a isto precisamos de triggers que promovam automaticamente para `is_primary=true` quando só tiver 1 contato, 1 endereço ou 1 rede social (1 de cada tipo: 1 instagram, 1 facebook, 1 whatsapp, etc).
---
Na criação da ladnig pages utilizamos a API do unsplash, mas também temos integração nativa com o Supabase Storage e implementamos uma página de galeria. O principal motivo: evitar repetição de imagens e duplicação desnecessaria, desta forma o usuário pode reaproveitar imagens ja existentes no banco de dados da sua conta em novas landing pages.

Mas atualmente durante a criação a API não consulte de fato todas as fontas de iamgens, devemos ter uma ordem de prioridade: imagens ja existentes > unsplash > LLM Memory.
---
Atualmente as API consultam ID de variantes de se seções que são IDS invalidos ou legados (exemplo src\app\api\imagem\route.ts:28).

Devemos consultar IDS em uma unica fonte de verdade para padronizar as requisições corretamente.

src\app\api
src\app\api\gerar-copy
src\app\api\gerar-copy\route.ts
src\app\api\gerar-lp
src\app\api\gerar-lp\route.ts
src\app\api\imagem
src\app\api\imagem\route.ts
src\app\api\melhorar-imagem
src\app\api\melhorar-imagem\route.ts
src\app\api\melhorar-texto
src\app\api\melhorar-texto\route.ts
---
As imagens enviadas das landing pages (iamgens enviadas manualmente via Input, e iamgens selecionadas por IA - quando novas) devem ser nomeadas.

Devemos ter ações de limpeza na galeria de imagens de "Apagar todas as imagens" (que só apagam as imagens orfãs sem landing pages).

O link para a landing page deve ser completo com "{SUBDOMAIN} + causi.adv.br + {SLUG}"