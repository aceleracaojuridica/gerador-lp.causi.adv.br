"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type AutoTextareaProps = React.ComponentProps<typeof Textarea>;

/** Textarea que ajusta a altura ao conteúdo, sem piso alto de espaço vazio. */
export function AutoTextarea({
  value,
  onChange,
  className,
  ...props
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={onChange}
      rows={1}
      {...props}
      // min-h-9 (~1 linha) vence o min-h grande do Textarea base e das chamadas,
      // deixando a altura acompanhar o texto em vez de sobrar espaço.
      className={cn(className, "min-h-9")}
    />
  );
}
