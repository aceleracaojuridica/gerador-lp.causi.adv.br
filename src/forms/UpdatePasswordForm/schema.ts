import { z } from "zod";

export const updatePasswordFormSchema = z
  .object({
    password: z
      .string()
      .min(7, "A senha deve ter ao menos 7 caracteres")
      .regex(/[a-z]/, "A senha deve ter ao menos 1 letra minúscula")
      .regex(/[A-Z]/, "A senha deve ter ao menos 1 letra maiúscula"),
    confirmPassword: z.string().min(7, "Confirme sua nova senha"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;
