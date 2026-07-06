import { toast } from "sonner";
import { type LpToastMessage, mapLpDbError, mapLpMessageError } from "./errors";

export function showAccessDeniedToast(description?: string) {
  toast.error("Acesso negado", {
    description:
      description ??
      "Você não tem permissão para usar o gerador de landing pages.",
  });
}

export function showLpToast(msg: LpToastMessage) {
  toast.error(msg.title, { description: msg.description });
}

export function showLpError(error: unknown) {
  showLpToast(mapLpDbError(error));
}

export function showLpMessageError(message: string) {
  showLpToast(mapLpMessageError(message));
}
