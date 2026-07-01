"use client";

import { createContext, useContext } from "react";

const LpAccessContext = createContext(false);

export function LpAccessProvider({
  hasLpAccess,
  children,
}: {
  hasLpAccess: boolean;
  children: React.ReactNode;
}) {
  return (
    <LpAccessContext.Provider value={hasLpAccess}>
      {children}
    </LpAccessContext.Provider>
  );
}

export function useLpAccess() {
  return useContext(LpAccessContext);
}
