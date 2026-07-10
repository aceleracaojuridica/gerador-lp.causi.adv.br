import { useLpAccess } from "@/components/lp-access-provider";
import { useSession } from "@/hooks/use-session";
import { showLpUpgradeToast } from "@/lib/toast";

/** Bloqueia mutações de LP no cliente quando o plano não inclui escrita. */
export function useLpWriteAccess() {
  const canWrite = useLpAccess();
  const session = useSession();

  function guardWrite(fn?: () => void): boolean {
    if (!canWrite) {
      showLpUpgradeToast(session);
      return false;
    }
    fn?.();
    return true;
  }

  return { canWrite, guardWrite };
}
