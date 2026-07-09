"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

type AutoTextareaProps = React.ComponentProps<typeof Textarea>;

function resizeToContent(el: HTMLTextAreaElement) {
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

/** Textarea que ajusta a altura conforme o conteúdo. */
export function AutoTextarea({ value, onChange, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: value externo precisa recalcular a altura
  useEffect(() => {
    if (ref.current) resizeToContent(ref.current);
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      onChange={(event) => {
        resizeToContent(event.currentTarget);
        onChange?.(event);
      }}
      rows={1}
      {...props}
    />
  );
}
