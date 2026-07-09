"use client";

import { Check, DragIndicator, Lock } from "@material-symbols-svg/react";
import { useState } from "react";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { effectiveOrder, labelOf } from "@/lib/landing-pages/section-order";
import {
  type LpTemplate,
  TEMPLATES,
  templatePreviewSrc,
} from "@/lib/landing-pages/templates";
import { LawyerPhotosInput } from "../widgets/lawyer-row";
import { SectionImageInput } from "../widgets/section-image-input";

export function FixedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2.5">
      <Lock size={16} className="text-slate-300" />
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="ml-auto text-[0.7rem] uppercase tracking-wide text-slate-300">
        fixo
      </span>
    </div>
  );
}

export function ReorderPanel({
  form,
  onClose,
}: {
  form: LpEditorForm;
  onClose: () => void;
}) {
  const order = effectiveOrder(form.layout, form.customSections);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function drop(target: number) {
    if (dragIdx !== null && dragIdx !== target) {
      const next = [...order];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      form.setSectionOrder(next);
    }
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Sequência</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ui px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ui-dark"
        >
          <Check size={14} /> Concluir
        </button>
      </div>
      <p className="text-xs text-ui-gray">
        Arraste para reordenar. Topo, Perguntas frequentes e Rodapé ficam fixos.
      </p>

      <FixedRow label="Topo da página" />
      <ul className="flex list-none flex-col gap-2">
        {order.map((item, i) => (
          <li
            key={item}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIdx(i);
            }}
            onDrop={() => drop(i)}
            onDragEnd={() => {
              setDragIdx(null);
              setOverIdx(null);
            }}
            className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition active:cursor-grabbing ${
              overIdx === i && dragIdx !== null && dragIdx !== i
                ? "border-ui ring-1 ring-ui/30"
                : "border-slate-200"
            } ${dragIdx === i ? "opacity-40" : ""}`}
          >
            <DragIndicator size={18} className="text-slate-400" />
            <span className="truncate text-sm font-medium text-slate-700">
              {labelOf(item, form.customSections)}
            </span>
          </li>
        ))}
      </ul>
      <FixedRow label="Perguntas frequentes" />
      <FixedRow label="Contato e rodapé" />
    </div>
  );
}

/** Imagens das seções e fotos dos advogados em um único painel. */
export function ImagensPanel({ form }: { form: LpEditorForm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Fotos dos advogados
        </p>
        <LawyerPhotosInput form={form} />
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Imagens da página
        </p>
        <SectionImageInput form={form} sectionKey="hero" label="Foto do topo" />
        <SectionImageInput
          form={form}
          sectionKey="sobre"
          label="Foto do Sobre"
        />
        <SectionImageInput
          form={form}
          sectionKey="dor"
          label="Foto das Dores"
        />
        <SectionImageInput
          form={form}
          sectionKey="solucao"
          label="Foto de Como você ajuda"
        />
      </div>
    </div>
  );
}

export function ModeloPicker({
  form,
  currentId,
}: {
  form: LpEditorForm;
  currentId: string | undefined;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs leading-relaxed text-slate-500">
        Aplica um estilo visual completo (layouts e fundos de todas as seções).
        Textos e imagens não são alterados.
      </p>
      {TEMPLATES.map((template: LpTemplate) => {
        const active = currentId === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => form.applyTemplate(template)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
              active
                ? "border-ui bg-ui-soft/60"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div
              role="img"
              aria-label={template.name}
              className="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-slate-200"
              style={{
                backgroundImage: `url('${templatePreviewSrc(template.id)}')`,
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${active ? "text-ui" : "text-slate-800"}`}
                >
                  {template.name}
                </span>
                {active ? (
                  <span className="rounded-[5px] bg-ui px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                    Atual
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-slate-400">
                {template.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
