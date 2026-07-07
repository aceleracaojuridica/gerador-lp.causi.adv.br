Para configurar a API do Unsplash no seu projeto, siga este passo a passo:

### 1. Criar uma Conta de Desenvolvedor no Unsplash
1. Acesse o portal de desenvolvedores do Unsplash em [unsplash.com/developers](https://unsplash.com/developers).
2. Faça login com a sua conta do Unsplash (ou crie uma gratuitamente).
3. Clique em **"Your Apps"** no menu superior e depois em **"New Application"**.
4. Leia e aceite os termos de uso da API do Unsplash e clique em **"Accept terms"**.
5. Dê um nome ao seu aplicativo (ex: `Gerador de LPs Causi`) e uma breve descrição, depois clique em **"Create Application"**.

---

### 2. Obter a Chave de Acesso (Access Key)
1. Na página do seu aplicativo recém-criado, role a tela até a seção **"Keys"**.
2. Você verá duas chaves: **Access Key** e **Secret Key**.
3. Copie a **Access Key** (a chave pública usada para autenticar as requisições HTTP).

> [!NOTE]
> Aplicações novas no Unsplash começam em modo de **Sandbox**, que limita a taxa de uso a **50 requisições por hora**. Isso é mais do que suficiente para desenvolvimento e testes locais. Para produção, você pode solicitar o upgrade para produção (gratuito) no próprio painel deles.

---

### 3. Configurar no Projeto
Adicione a chave copiada nas variáveis de ambiente do seu projeto:

1. Abra o arquivo `.env.local` (ou `.env` caso não use o local) na raiz do projeto.
2. Adicione a seguinte linha substituindo `SUA_CHAVE_AQUI` pela chave copiada:

```env
UNSPLASH_ACCESS_KEY=SUA_CHAVE_AQUI
```

3. Reinicie o servidor de desenvolvimento (`pnpm dev`) para que o Next.js carregue a nova variável de ambiente.