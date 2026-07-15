"use client";

import {
  KeyboardArrowDown,
  Palette,
  ProgressActivity,
} from "@material-symbols-svg/react";
import { useState } from "react";
import { LogoImageHint } from "@/components/Builder/shared/image-hint";
import { LazyImageSlot } from "@/components/Builder/shared/image-picker-dialog";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { SugerirPaletasButton } from "../../create/sugerir-paletas-button";
import { BuilderField } from "../../shared/fields";
import { PalettePicker } from "../../shared/palette-picker";

/** Logo, cores da marca e tema de referência da LP. */
export function IdentidadePanel({ form }: { form: LpEditorForm }) {
  const { office, theme, autoTheme } = form;
  const [palOpen, setPalOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function extrair() {
    setExtracting(true);
    setFalhou(false);
    const ok = await form.applyLogoPalette(office.logoSrc);
    setFalhou(!ok);
    setExtracting(false);
  }

  return (
    <div className="space-y-3">
      {form.tema ? (
        <BuilderField
          label="Tema da página"
          hint="Referência do foco da página (definido na criação)."
        >
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
            {form.tema}
          </p>
        </BuilderField>
      ) : null}

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Logo
        </p>
        <LazyImageSlot
          src={office.logoSrc}
          label="Logo do escritório"
          onChange={form.setLogoUrl}
          onClear={() => form.setLogoUrl("")}
          // "Extrair cores" fica ao lado do "Alterar imagem" (só faz sentido
          // com uma logo carregada).
          extraActions={
            office.logoSrc ? (
              <button
                type="button"
                onClick={extrair}
                disabled={extracting}
                className="inline-flex items-center gap-1.5 border border-ui/30 bg-ui-soft px-2.5 py-1.5 text-xs font-medium text-ui transition hover:bg-ui/15 disabled:opacity-60"
              >
                {extracting ? (
                  <ProgressActivity size={14} className="animate-spin" />
                ) : (
                  <Palette size={14} />
                )}
                {extracting ? "Lendo a logo…" : "Extrair cores da logo"}
              </button>
            ) : undefined
          }
        />
        <LogoImageHint />
        {office.logoSrc && falhou ? (
          <p className="text-xs text-red-600">
            Não consegui ler cores dessa logo. As cores atuais foram mantidas.
          </p>
        ) : office.logoSrc && autoTheme ? (
          <p className="text-xs text-emerald-600">
            <Palette size={13} className="inline" /> Cores extraídas da logo
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-border/60 pt-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Cores da marca
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex gap-1.5">
            {[
              theme.brand,
              theme.brandDark,
              theme.accent,
              theme.accentSoft,
              theme.cream,
            ].map((c, index) => (
              <span
                key={`${index}-${c}`}
                className="h-6 w-6 rounded-full border border-border"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
            {form.extractedTheme ? (
              <SugerirPaletasButton
                baseTheme={form.extractedTheme}
                value={theme}
                onPick={form.applyPalette}
              />
            ) : null}
          </span>
          <button
            type="button"
            onClick={() => setPalOpen((v) => !v)}
            aria-expanded={palOpen}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-ui-hover"
          >
            {palOpen ? "Fechar" : "Trocar"}
            <KeyboardArrowDown
              size={14}
              className={`transition-transform ${palOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <PalettePicker
          value={theme}
          onPick={form.applyPalette}
          open={palOpen}
          className="pt-1"
        />
      </div>
    </div>
  );
}
