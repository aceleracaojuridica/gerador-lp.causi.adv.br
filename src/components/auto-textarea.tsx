"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AutoTextareaProps = React.ComponentProps<typeof Textarea>;

/** `useLayoutEffect` não roda no servidor (e avisa no console). O ajuste de
 *  altura só existe no browser, então escolhemos o efeito por ambiente. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** Textarea que ajusta a altura ao conteúdo, sem piso alto de espaço vazio.
 *  Recalcula ao mudar o conteúdo e ao mudar a largura (evita altura travada
 *  quando o campo é medido enquanto o painel ainda está estreito). */
export function AutoTextarea({
  value,
  onChange,
  className,
  ...props
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // "auto" colapsa para 1 linha só para o scrollHeight refletir o conteúdo.
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // ANTES do paint. Com `useEffect`, o navegador chegava a pintar o estado
  // colapsado do passo acima e só depois a altura final — era isso que fazia o
  // campo "piscar" a cada caractere digitado ou apagado.
  useIsomorphicLayoutEffect(() => {
    fit();
  }, [value, fit]);

  // Observer criado UMA vez. Antes ele era destruído e recriado a cada tecla,
  // porque `value` estava nas dependências deste mesmo efeito.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Só reajusta quando a LARGURA muda (mudar a altura dentro do fit não deve
    // disparar de novo — evita loop do ResizeObserver).
    let lastWidth = el.clientWidth;
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? lastWidth;
      if (width !== lastWidth) {
        lastWidth = width;
        fit();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      {...props}
      // field-sizing-fixed: o JS controla a altura (o reset "auto" volta a 1 linha
      // e cresce só até o conteúdo). min-h-9 (~1 linha) vence o min-h grande do
      // Textarea base e das chamadas, evitando espaço vazio.
      className={cn(className, "field-sizing-fixed min-h-9")}
    />
  );
}
