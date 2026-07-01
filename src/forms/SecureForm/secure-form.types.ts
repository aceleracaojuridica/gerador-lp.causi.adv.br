import type { SecureFormValues } from "./schema";

/**
 * Propriedades para o componente SecureForm.
 */
export interface SecureFormProps {
  /**
   * Callback acionado ao submeter o formulário com sucesso.
   */
  onSubmit?: (data: SecureFormValues) => Promise<void>;

  /**
   * Indica se o formulário está em estado de carregamento.
   */
  isLoading?: boolean;
}
