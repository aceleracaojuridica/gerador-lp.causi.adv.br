"use client";

import { useEffect, useState } from "react";
import { hexFromColorInput } from "@/lib/landing-pages/colors";
import type { Theme } from "@/lib/landing-pages/schema";

const COLOR_FIELDS: { key: keyof Theme; label: string }[] = [
  { key: "brand", label: "Marca" },
  { key: "brandDark", label: "Marca escura" },
  { key: "accent", label: "Destaque" },
  { key: "accentSoft", label: "Destaque claro" },
  { key: "cream", label: "Fundo" },
  { key: "creamDeep", label: "Fundo profundo" },
  { key: "ink", label: "Texto" },
  { key: "inkSoft", label: "Texto suave" },
];

/** Uma cor: swatch com color picker nativo + campo de texto (HEX ou HSL). */
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [text, setText] = useState(value);
  // Reflete mudanças externas (troca de paleta, extração da logo).
  useEffect(() => setText(value), [value]);

  function commit(raw: string) {
    const hex = hexFromColorInput(raw);
    if (hex) {
      onChange(hex);
      setText(hex);
    } else {
      setText(value); // entrada inválida: volta ao valor atual
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-8 shrink-0 overflow-hidden rounded-md border border-border"
        style={{ backgroundColor: value }}
      >
        <span className="sr-only">{`Escolher ${label}`}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <input
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit(text);
          }
        }}
        spellCheck={false}
        placeholder="#0f1828 ou hsl(…)"
        className="w-full min-w-0 rounded-[5px] border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
      />
      <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

/** Editor manual das cores do tema — aceita HEX ou HSL em cada campo. */
export function ManualColorEditor({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (key: keyof Theme, hex: string) => void;
}) {
  return (
    <div className="space-y-2">
      {COLOR_FIELDS.map(({ key, label }) => (
        <ColorRow
          key={key}
          label={label}
          value={theme[key]}
          onChange={(hex) => onChange(key, hex)}
        />
      ))}
    </div>
  );
}
