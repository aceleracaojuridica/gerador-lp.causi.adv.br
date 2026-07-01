"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  buildAuthCallbackUrl,
  getAuthErrorMessage,
  getSafeRedirectPath,
} from "@/lib/auth/auth";
import { showAuthEmailToast } from "@/lib/auth/auth-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { type SignUpFormValues, signUpFormSchema } from "./schema";
import type { SignUpFormProps } from "./signup-form.types";

const SIGNUP_EMAIL_STORAGE_KEY = "causi:signup-email";

/**
 * Formulário de cadastro com envio de metadados e confirmação por e-mail.
 *
 * @remarks
 * `emailRedirectTo` aponta para o callback SSR. Suporta cenários com e sem confirmação
 * obrigatória (`email_confirm: true/false`). Metadados `user_name` e `account_name` são enviados
 * via `options.data` no `signUp`.
 */
export default function SignUpForm({
  id,
  nextPath = "/dashboard",
  onSuccess,
}: SignUpFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      name: "",
      office: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");

  const validations = [
    { label: "Mínimo 7 caracteres", isValid: password.length >= 7 },
    { label: "1 letra minúscula", isValid: /[a-z]/.test(password) },
    { label: "1 letra maiúscula", isValid: /[A-Z]/.test(password) },
    {
      label: "As senhas coincidem",
      isValid: password !== "" && password === confirmPassword,
    },
  ];

  const handleSubmit = async (values: SignUpFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    const safeNextPath = getSafeRedirectPath(nextPath, "/dashboard");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(
            `/confirmar?next=${encodeURIComponent(safeNextPath)}`,
          ),
          data: {
            user_name: values.name,
            account_name: values.office,
          },
        },
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        setFormError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      if (data.session) {
        // Confirmação de e-mail desabilitada: redireciona para /confirmar para provisioning
        try {
          sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, values.email);
        } catch {}

        onSuccess?.(values);

        router.replace(`/confirmar?next=${encodeURIComponent(safeNextPath)}`);
        return;
      }

      // Confirmação de e-mail obrigatória: redireciona para /confirmar com status
      try {
        sessionStorage.setItem(SIGNUP_EMAIL_STORAGE_KEY, values.email);
      } catch {}

      onSuccess?.(values);

      showAuthEmailToast(
        values.email,
        "Verifique seu e-mail",
        "Sua conta foi criada. Use o link enviado para confirmar seu e-mail e ativar o acesso.",
      );

      const confirmationUrl = new URL("/confirmar", window.location.origin);
      confirmationUrl.searchParams.set("status", "confirm-email");
      confirmationUrl.searchParams.set("next", safeNextPath);
      router.replace(`${confirmationUrl.pathname}${confirmationUrl.search}`);
    } catch {
      const errorMessage =
        "Erro de conexão. Verifique sua internet e tente novamente.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Seu nome"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="office"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Escritório</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder="Nome do escritório"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            <div
              onFocusCapture={() => setIsPasswordFocused(true)}
              onBlurCapture={(event) => {
                const nextTarget = event.relatedTarget as Node | null;
                if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
                  setIsPasswordFocused(false);
                }
              }}
            >
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <ul
                  className={cn(
                    "max-h-0 overflow-hidden opacity-0 space-y-1 text-xs list-disc pl-5 text-muted-foreground transition-all duration-300",
                    isPasswordFocused || field.value.length > 0
                      ? "max-h-32 opacity-100 mt-2"
                      : null,
                  )}
                >
                  {validations.map((v) => (
                    <li
                      key={v.label}
                      className={cn(
                        v.isValid &&
                          "text-primary font-medium transition-colors",
                      )}
                    >
                      {v.label}
                    </li>
                  ))}
                </ul>
                <FormMessage />
              </FormItem>

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field: confirmField }) => (
                  <FormItem className="mt-5">
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl>
                      <Input
                        {...confirmField}
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        />

        <p className="text-sm leading-relaxed text-muted-foreground">
          Ao se registrar você concorda com os{" "}
          <a
            href="https://www.causi.com.br/advogado/termos-uso"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            termos de uso
          </a>{" "}
          e nossa{" "}
          <a
            href="https://www.causi.com.br/advogado/politica-privacidade"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            política de privacidade
          </a>
          .
        </p>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Criando conta...
            </>
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>
    </Form>
  );
}
