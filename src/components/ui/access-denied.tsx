import {
  ArrowBack,
  Lock,
  OpenInNew,
} from "@material-symbols-svg/react/rounded";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CAUSI_APP_URL } from "@/lib/session";

export function AccessDenied({ description }: { description?: string }) {
  return (
    <div className="app-ui flex min-h-full flex-col items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <p className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock size={28} aria-hidden />
          </p>
          <CardTitle className="mt-4 text-xl">Acesso negado</CardTitle>
          <CardDescription>
            {description ??
              "Seu plano atual não inclui o gerador de landing pages. Faça upgrade no painel do Causi para criar e editar páginas."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowBack size={16} aria-hidden /> Voltar
            </Link>
          </Button>
          <Button asChild>
            <a href={CAUSI_APP_URL}>
              <OpenInNew size={16} aria-hidden /> Ir para o Causi
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
