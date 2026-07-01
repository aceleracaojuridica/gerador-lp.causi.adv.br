"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormErrorBanner } from "@/components/auth/form-error-banner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { getAuthErrorMessage, getSafeRedirectPath } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/client";
import { type SignInFormValues, signInFormSchema } from "./schema";
import type { SignInFormProps } from "./signin-form.types";

/**
 * Formulário de login com autenticação via Supabase Auth.
 *
 * @remarks
 * Usa `nextPath` para preservar o destino original quando o `proxy.ts` intercepta
 * rotas protegidas.
 */
export default function SigninForm({
  id,
  nextPath = "/",
  onSuccess,
}: SignInFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (values: SignInFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setIsSubmitting(false);

        const message = (error.message ?? "").toString().toLowerCase();
        if (message.includes("email not confirmed")) {
          const confirmUrl = new URL("/login", window.location.origin);
          confirmUrl.searchParams.set("status", "confirm-email");
          confirmUrl.searchParams.set("email", values.email);
          confirmUrl.searchParams.set("next", nextPath);
          router.replace(`${confirmUrl.pathname}${confirmUrl.search}`);
          return;
        }

        const errorMessage = getAuthErrorMessage(error);
        setFormError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      // Não reseta isSubmitting aqui — o redirect vai desmontar o componente,
      // evitando o flash do botão reabilitado antes da navegação.
      toast.success("Login realizado com sucesso.");
      onSuccess?.(values);

      const safeNext = getSafeRedirectPath(nextPath);

      // Verificar se o usuário tem provisioning completo (public.users + account)
      const { data: publicUser } = await supabase
        .from("users")
        .select("account_id")
        .eq("id", data.user?.id)
        .maybeSingle();

      if (!publicUser?.account_id) {
        router.replace(`/confirmar?next=${encodeURIComponent(safeNext)}`);
        router.refresh();
        return;
      }

      router.replace(safeNext);
      router.refresh();
    } catch {
      setIsSubmitting(false);
      setFormError("Erro inesperado. Tente novamente.");
    }
  };

  return (
    <Form {...form}>
      <form
        id={id}
        method="post"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        <FormErrorBanner message={formError} />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="nome@email.com"
                  autoComplete="email"
                  className="placeholder:text-muted-foreground/40"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-start">
          <Button type="button" variant="link" className="h-auto px-0" asChild>
            <Link href="/redefinir">Esqueci minha senha</Link>
          </Button>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </Form>
  );
}
