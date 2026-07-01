import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export default function NotFoundPage() {
  return (
    <AuthPageShell>
      <AuthFormShell
        title="Erro 404"
        description="Esta pagina nao foi encontrada"
        footerText="Voltar para o inicio"
        footerHref="/"
        footerLabel="Ir para o inicio"
      >
        <p className="text-center text-sm leading-6 text-muted-foreground">
          O endereco acessado nao existe ou pode ter sido movido.
        </p>
      </AuthFormShell>
    </AuthPageShell>
  );
}
