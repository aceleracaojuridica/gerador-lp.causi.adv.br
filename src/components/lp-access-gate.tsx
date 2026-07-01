"use client";

import type { ReactNode } from "react";
import { useLpAccess } from "@/components/lp-access-provider";

/** Oculta o conteúdo da rota quando o usuário não tem plano LP; mantém sidebar. */
export function LpAccessGate({ children }: { children: ReactNode }) {
  const hasLpAccess = useLpAccess();

  if (!hasLpAccess) {
    return <div className="h-full min-h-full w-full bg-background" />;
  }

  return children;
}
