import { toast } from "sonner";

export function showAccessDeniedToast(description?: string) {
  toast.error("Acesso negado", {
    description:
      description ??
      "Você não tem permissão para usar o gerador de landing pages.",
  });
}
