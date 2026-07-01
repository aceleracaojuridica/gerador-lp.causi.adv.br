import { z } from "zod";

/**
 * Schema de validação para o formulário de cadastro de novos usuários.
 *
 * @example
 * const result = signUpFormSchema.safeParse({
 *   name: "João Silva",
 *   office: "Silva Advogados",
 *   email: "joao@silva.com",
 *   password: "senha-segura-123",
 *   confirmPassword: "senha-segura-123"
 * })
 */
export const signUpFormSchema = z
  .object({
    name: z.string().min(2, "Informe seu nome"),
    office: z.string().min(2, "Informe o nome do escritório"),
    email: z.string().email("Informe um e-mail válido"),
    password: z
      .string()
      .min(7, "A senha deve ter ao menos 7 caracteres")
      .regex(/[a-z]/, "A senha deve ter ao menos 1 letra minúscula")
      .regex(/[A-Z]/, "A senha deve ter ao menos 1 letra maiúscula"),
    confirmPassword: z.string().min(7, "Confirme sua senha"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

/**
 * Tipagem inferida do schema de cadastro.
 */
export type SignUpFormValues = z.infer<typeof signUpFormSchema>;
