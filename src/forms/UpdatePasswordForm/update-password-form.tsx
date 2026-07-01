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
import { getAuthErrorMessage, getSafeRedirectPath } from "@/lib/auth/auth";
import { createClient } from "@/lib/supabase/client";
import {
  type UpdatePasswordFormValues,
  updatePasswordFormSchema,
} from "./schema";
import type { UpdatePasswordFormProps } from "./update-password-form.types";

/**
 * Formulário de conclusão de redefinição de senha.
 *
 * @remarks
 * Requer uma sessão de recovery válida criada pelo callback SSR. Submeter sem essa
 * sessão falhará silenciosamente no Supabase Auth.
 */
export default function UpdatePasswordForm({
  id,
  nextPath = "/dashboard",
  onSuccess,
}: UpdatePasswordFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (values: UpdatePasswordFormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        const errorMessage = getAuthErrorMessage(error);
        setFormError(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success("Senha atualizada com sucesso.");
      onSuccess?.(values);
      router.replace(getSafeRedirectPath(nextPath));
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-5"
      >
        <FormErrorBanner message={formError} />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
              <FormControl>
                <Input
                  {...field}
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar nova senha</FormLabel>
              <FormControl>
                <Input
                  {...field}
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

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner />
              Atualizando senha...
            </>
          ) : (
            "Salvar nova senha"
          )}
        </Button>
      </form>
    </Form>
  );
}
