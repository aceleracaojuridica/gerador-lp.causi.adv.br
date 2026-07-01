"use client";

import {
  forwardRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type Viewport = "desktop" | "tablet" | "mobile";

// Larguras de viewport simuladas. `desktop` = largura total do painel (sem
// moldura); tablet/mobile usam larguras reais de dispositivo para que as
// media queries do Tailwind (md:, lg:) respondam de verdade.
export const VIEWPORT_WIDTH: Record<Viewport, number | null> = {
  desktop: null,
  tablet: 820,
  mobile: 390,
};

/**
 * Renderiza o preview dentro de um <iframe> same-origin. Como o iframe tem seu
 * próprio viewport, estreitar a largura (tablet/mobile) faz as media queries da
 * LP reagirem como num dispositivo real — coisa que uma simples <div> estreita
 * não faria (media query é por viewport, não por container).
 *
 * Os estilos do documento pai (Tailwind + next/font) são clonados para dentro
 * do iframe; o conteúdo React é injetado via portal no <body> do iframe.
 */
export const DevicePreview = forwardRef<
  HTMLIFrameElement,
  { mode: Viewport; children: ReactNode }
>(function DevicePreview({ mode, children }, ref) {
  const innerRef = useRef<HTMLIFrameElement | null>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  function setRefs(node: HTMLIFrameElement | null) {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  }

  // Copia estilos + classes de fonte do documento pai para o iframe.
  const syncStyles = useCallback((doc: Document) => {
    doc.head.querySelectorAll("[data-cloned]").forEach((n) => {
      n.remove();
    });
    document
      .querySelectorAll('style, link[rel="stylesheet"]')
      .forEach((node) => {
        const clone = node.cloneNode(true) as HTMLElement;
        clone.setAttribute("data-cloned", "");
        doc.head.appendChild(clone);
      });
    // Preview da LP sempre em modo claro — evita texto claro herdado do app dark.
    doc.documentElement.className = document.documentElement.className
      .replace(/\bdark\b/g, "")
      .trim();
    doc.documentElement.style.colorScheme = "light";
    doc.body.className = document.body.className;
    doc.body.style.margin = "0";
    doc.body.style.background = "#ffffff";
  }, []);

  // Configura o documento do iframe SEM depender do onLoad: um iframe sem `src`
  // costuma disparar o load antes do React anexar o handler, deixando o portal
  // vazio. Aqui acessamos o contentDocument direto (same-origin) com retry.
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    function setup() {
      const doc = innerRef.current?.contentDocument;
      if (!doc || !doc.body) {
        raf = requestAnimationFrame(setup);
        return;
      }
      syncStyles(doc);
      if (!cancelled) setMountNode(doc.body);
    }
    setup();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [syncStyles]);

  // Mantém os estilos do iframe em sincronia com HMR/troca de tema no dev:
  // reobserva o <head> do pai e recopia quando algo muda.
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const doc = innerRef.current?.contentDocument;
      if (doc?.body) syncStyles(doc);
    });
    obs.observe(document.head, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [syncStyles]);

  const width = VIEWPORT_WIDTH[mode];
  const framed = width !== null;

  return (
    <div
      className={`flex h-full w-full justify-center overflow-auto ${
        framed ? "bg-slate-200/70 p-4" : "bg-white"
      }`}
    >
      <div
        style={framed ? { width } : undefined}
        className={`h-full w-full shrink-0 ${
          framed
            ? "max-w-full overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl ring-1 ring-black/5"
            : ""
        }`}
      >
        <iframe
          ref={setRefs}
          title="Prévia do dispositivo"
          className="h-full w-full border-0"
        />
      </div>
      {mountNode ? createPortal(children, mountNode) : null}
    </div>
  );
});
