"use client";

import { KeyboardArrowDown, Palette, Undo } from "@material-symbols-svg/react";
import { useState } from "react";
import { LazyImageSlot } from "@/components/Builder/shared/image-picker-dialog";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { BuilderField } from "../../shared/fields";
import { PalettePicker } from "../../shared/palette-picker";

/** Logo, cores da marca e tema de referência da LP. */
export function IdentidadePanel({ form }: { form: LpEditorForm }) {
  const { office, theme, autoTheme } = form;
  const [palOpen, setPalOpen] = useState(false);

  return (
    <div className="space-y-3">
      {form.tema ? (
        <BuilderField
          label="Tema da página"
          hint="Referência do foco da página (definido na criação)."
        >
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {form.tema}
          </p>
        </BuilderField>
      ) : null}

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Logo
        </p>
        <LazyImageSlot
          src={office.logoSrc}
          label="Logo do escritório"
          onChange={form.setLogoUrl}
          onClear={() => form.setLogoUrl("")}
        />
        {office.logoSrc && autoTheme ? (
          <p className="text-xs text-emerald-600">
            <Palette size={13} className="inline" /> Cores extraídas da logo
          </p>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
            Cores da marca
          </p>
          <button
            type="button"
            onClick={form.resetTheme}
            className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-700"
          >
            <Undo size={13} /> Padrão
          </button>
        </div>
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
                className="h-6 w-6 rounded-full border border-slate-200"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={() => setPalOpen((v) => !v)}
            aria-expanded={palOpen}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-ui-hover"
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
