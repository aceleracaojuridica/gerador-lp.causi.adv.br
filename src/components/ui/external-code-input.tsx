"use client";

import {
  Code,
  ContentCopy,
  Edit,
  Visibility,
} from "@material-symbols-svg/react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type ExternalCodeInputMode = "edit" | "view";

export function ExternalCodeInput({
  value,
  onChange,
  placeholder,
  fileName = "snippet.html",
  className,
  icon,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fileName?: string;
  className?: string;
  icon?: ReactNode;
}) {
  const [mode, setMode] = useState<ExternalCodeInputMode>("edit");

  const preview = useMemo(() => {
    const trimmed = value.trim();
    if (trimmed.length > 0) return value;
    return placeholder ?? "Sem código preenchido.";
  }, [placeholder, value]);

  async function copyToClipboard() {
    if (!value.trim()) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Evita erro visual em ambientes sem Clipboard API.
    }
  }

  return (
    <InputGroup className={cn("h-auto", className)}>
      {mode === "edit" ? (
        <InputGroupTextarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 resize-y font-mono text-xs"
          placeholder={placeholder}
          aria-label="Editor de código externo"
        />
      ) : (
        <div
          data-slot="input-group-control"
          className="max-h-72 w-full overflow-auto px-3 py-3 font-mono text-xs whitespace-pre-wrap"
        >
          {preview}
        </div>
      )}

      <InputGroupAddon align="block-start">
        {icon ?? <Code className="text-muted-foreground" />}
        <InputGroupText className="font-mono">{fileName}</InputGroupText>
        <InputGroupButton
          size="icon-xs"
          className="ml-auto"
          onClick={() => setMode("edit")}
          variant={mode === "edit" ? "secondary" : "ghost"}
          aria-pressed={mode === "edit"}
          title="Editar código"
        >
          <Edit />
          <span className="sr-only">Editar</span>
        </InputGroupButton>
        <InputGroupButton
          size="icon-xs"
          onClick={() => setMode("view")}
          variant={mode === "view" ? "secondary" : "ghost"}
          aria-pressed={mode === "view"}
          title="Visualizar código"
        >
          <Visibility />
          <span className="sr-only">Visualizar</span>
        </InputGroupButton>
        <InputGroupButton
          size="icon-xs"
          onClick={copyToClipboard}
          disabled={!value.trim()}
        >
          <ContentCopy />
          <span className="sr-only">Copiar código</span>
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
