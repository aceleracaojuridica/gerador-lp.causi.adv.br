"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AutoTextareaProps = React.ComponentProps<typeof Textarea>;

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: refit ao mudar o conteúdo
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();

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
  }, [value]);

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
