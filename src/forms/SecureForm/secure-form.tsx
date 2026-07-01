"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type SecureFormValues, secureFormSchema } from "./schema";
import type { SecureFormProps } from "./secure-form.types";

/**
 * Formulário de alteração de senha com checklist de validação em tempo real.
 *
 * @remarks
 * O checklist de força da senha aparece apenas quando o campo tem foco ou valor. O botão
 * de submit é desabilitado enquanto o formulário não for modificado (`isDirty === false`).
 */
export function SecureForm({ onSubmit, isLoading }: SecureFormProps) {
  const form = useForm<SecureFormValues>({
    resolver: zodResolver(secureFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const newPassword = form.watch("newPassword");
  const confirmPassword = form.watch("confirmPassword");

  const validations = [
    { label: "Mínimo 7 caracteres", isValid: newPassword.length >= 7 },
    { label: "1 letra minúscula", isValid: /[a-z]/.test(newPassword) },
    { label: "1 letra maiúscula", isValid: /[A-Z]/.test(newPassword) },
    {
      label: "As senhas coincidem",
      isValid: newPassword !== "" && newPassword === confirmPassword,
    },
  ];

  const handleSubmit = async (data: SecureFormValues) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Mock submission
        console.log("Security data:", data);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success("Senha atualizada com sucesso!");
        form.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Security submission error:", error);
      toast.error("Erro ao atualizar a senha. Verifique sua senha atual.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-0">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 md:py-6 border-b border-border space-y-0">
              <div className="md:col-span-1">
                <FormLabel className="text-base font-semibold">
                  Senha atual
                </FormLabel>
                <FormDescription>Para validar a alteração</FormDescription>
              </div>
              <div className="md:col-span-2 space-y-2">
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 md:py-6 border-b border-border space-y-0 group">
              <div className="md:col-span-1">
                <FormLabel className="text-base font-semibold">
                  Nova senha
                </FormLabel>
                <FormDescription>Crie uma senha forte</FormDescription>
              </div>
              <div className="md:col-span-2 space-y-2">
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </FormControl>
                <ul
                  className={cn(
                    "max-h-0 overflow-hidden opacity-0 space-y-1 text-xs list-disc pl-5 text-muted-foreground transition-all duration-300",
                    field.value.length > 0
                      ? "max-h-32 opacity-100 mt-2"
                      : "group-focus-within:max-h-32 group-focus-within:opacity-100 group-focus-within:mt-2",
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
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 md:py-6 border-b border-border space-y-0 last:border-0">
              <div className="md:col-span-1">
                <FormLabel className="text-base font-semibold">
                  Confirmar nova senha
                </FormLabel>
                <FormDescription>Repita a nova senha</FormDescription>
              </div>
              <div className="md:col-span-2 space-y-2">
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </FormControl>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="mt-8 flex justify-end pb-10">
          <Button
            type="submit"
            className="w-full sm:w-68"
            disabled={isLoading || !form.formState.isDirty}
          >
            {isLoading ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
