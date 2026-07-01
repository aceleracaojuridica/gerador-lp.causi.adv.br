"use client";

import { useEffect, useState } from "react";

/**
 * Hook para verificar breakpoints do Tailwind no client-side sem erros de hidratação.
 *
 * @remarks
 * `useMediaQuery` da `uidotdev` falha no App Router (SSR). Este hook escuta `matchMedia`
 * exclusivamente dentro de `useEffect`. Usa os mesmos breakpoints do Tailwind CSS padrão.
 */
export function useBreakpoints() {
  const [mounted, setMounted] = useState(false);
  const [breakpoints, setBreakpoints] = useState({
    isSm: false,
    isMd: false,
    isLg: false,
    isXl: false,
    is2xl: false,
  });

  useEffect(() => {
    setMounted(true);

    function checkBreakpoints() {
      setBreakpoints({
        isSm: window.matchMedia("only screen and (min-width: 640px)").matches,
        isMd: window.matchMedia("only screen and (min-width: 768px)").matches,
        isLg: window.matchMedia("only screen and (min-width: 1024px)").matches,
        isXl: window.matchMedia("only screen and (min-width: 1280px)").matches,
        is2xl: window.matchMedia("only screen and (min-width: 1536px)").matches,
      });
    }

    // Inicializa os valores reais uma vez montado no cliente
    checkBreakpoints();

    // Prepara os media queries para os eventos de mudança
    const smQuery = window.matchMedia("only screen and (min-width: 640px)");
    const mdQuery = window.matchMedia("only screen and (min-width: 768px)");
    const lgQuery = window.matchMedia("only screen and (min-width: 1024px)");
    const xlQuery = window.matchMedia("only screen and (min-width: 1280px)");
    const xxlQuery = window.matchMedia("only screen and (min-width: 1536px)");

    // Adiciona o listener para reagir a redimensionamentos
    smQuery.addEventListener("change", checkBreakpoints);
    mdQuery.addEventListener("change", checkBreakpoints);
    lgQuery.addEventListener("change", checkBreakpoints);
    xlQuery.addEventListener("change", checkBreakpoints);
    xxlQuery.addEventListener("change", checkBreakpoints);

    // Limpa os listeners ao desmontar o componente
    return () => {
      smQuery.removeEventListener("change", checkBreakpoints);
      mdQuery.removeEventListener("change", checkBreakpoints);
      lgQuery.removeEventListener("change", checkBreakpoints);
      xlQuery.removeEventListener("change", checkBreakpoints);
      xxlQuery.removeEventListener("change", checkBreakpoints);
    };
  }, []);

  if (!mounted) {
    return {
      isSm: false,
      isMd: false,
      isLg: false,
      isXl: false,
      is2xl: false,
      active: "ssr",
    };
  }

  return { ...breakpoints, active: "client" };
}
