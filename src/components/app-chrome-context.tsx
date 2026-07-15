"use client";

import { createContext, useContext } from "react";

type AppChrome = {
  /**
   * Esconde a trilha de ícones do app no desktop.
   *
   * Existe para o editor: recolher a navegação dele significa "quero a tela
   * inteira para o preview", e a trilha do app faz parte dessa tela. Quem liga
   * isso é responsável por desligar ao sair — senão o app fica sem navegação.
   */
  sidebarHidden: boolean;
  setSidebarHidden: (hidden: boolean) => void;
};

const AppChromeContext = createContext<AppChrome>({
  sidebarHidden: false,
  setSidebarHidden: () => {},
});

export const AppChromeProvider = AppChromeContext.Provider;

export function useAppChrome(): AppChrome {
  return useContext(AppChromeContext);
}
