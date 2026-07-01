import type { SignInFormValues } from "./schema";

/**
 * Propriedades para o componente SigninForm.
 */
export interface SignInFormProps {
  id?: string;
  nextPath?: string;
  onSuccess?: (values: SignInFormValues) => void;
}
