import type { SignUpFormValues } from "./schema";

/**
 * Propriedades para o componente SignUpForm.
 */
export interface SignUpFormProps {
  id?: string;
  nextPath?: string;
  onSuccess?: (values: SignUpFormValues) => void;
}
