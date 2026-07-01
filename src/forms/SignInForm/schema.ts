import { z } from "zod";

/**
 * Schema de validação para o formulário de login.
 *
 * @example
 * const result = signInFormSchema.safeParse({
 *   email: "usuario@exemplo.com",
 *   password: "senha-segura"
 * })
 */
export const signInFormSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

/**
 * Tipagem inferida do schema de login.
 */
export type SignInFormValues = z.infer<typeof signInFormSchema>;
