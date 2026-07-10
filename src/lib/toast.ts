import { toast } from "sonner";
import { getLpUpgradeMessage } from "@/lib/session/access";
import type { Session } from "@/lib/session/types";
import { type LpToastMessage, mapLpDbError, mapLpMessageError } from "./errors";

export function showLpUpgradeToast(session?: Session | null) {
  toast.error("Acesso negado", {
    description: getLpUpgradeMessage(session ?? null),
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
