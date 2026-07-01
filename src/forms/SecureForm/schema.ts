import { z } from "zod";

export const secureFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Senha atual é obrigatória"),
    newPassword: z
      .string()
      .min(7, "A senha deve ter ao menos 7 caracteres")
      .regex(/[a-z]/, "A senha deve ter ao menos 1 letra minúscula")
      .regex(/[A-Z]/, "A senha deve ter ao menos 1 letra maiúscula"),
    confirmPassword: z.string().min(7, "Confirme sua senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

export type SecureFormValues = z.infer<typeof secureFormSchema>;
