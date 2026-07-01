import type { UpdatePasswordFormValues } from "./schema";

export interface UpdatePasswordFormProps {
  id?: string;
  nextPath?: string;
  onSuccess?: (values: UpdatePasswordFormValues) => void;
}
