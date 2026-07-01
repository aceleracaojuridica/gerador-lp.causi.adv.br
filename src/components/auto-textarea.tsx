"use client";

import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

type AutoTextareaProps = React.ComponentProps<typeof Textarea>;

/** Textarea que ajusta a altura conforme o conteúdo. */
export function AutoTextarea({ value, onChange, ...props }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea ref={ref} value={value} onChange={onChange} rows={1} {...props} />
  );
}
