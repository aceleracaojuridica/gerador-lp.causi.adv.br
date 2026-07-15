"use client";

import { Check, DragIndicator, Lock } from "@material-symbols-svg/react";
import { useState } from "react";
import { LawyerImageHint } from "@/components/Builder/shared/image-hint";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { Office } from "@/lib/landing-pages/schema";
import { effectiveOrder, labelOf } from "@/lib/landing-pages/section-order";
import { LawyerPhotosInput } from "../widgets/lawyer-row";
import { SectionImageInput } from "../widgets/section-image-input";

export function FixedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2.5">
      <Lock size={16} className="text-muted-foreground/60" />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="ml-auto text-[0.7rem] uppercase tracking-wide text-muted-foreground/60">
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
        <p className="text-sm font-semibold text-foreground">Sequência</p>
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
            className={`flex cursor-grab items-center gap-2 rounded-lg border bg-card px-3 py-2.5 transition active:cursor-grabbing ${
              overIdx === i && dragIdx !== null && dragIdx !== i
                ? "border-ui ring-1 ring-ui/30"
                : "border-border"
            } ${dragIdx === i ? "opacity-40" : ""}`}
          >
            <DragIndicator size={18} className="text-muted-foreground" />
            <span className="truncate text-sm font-medium text-foreground">
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

/**
 * O que o topo exibe depende de haver imagem escolhida e de quantos advogados
 * existem. A dica precisa dizer qual dos casos está valendo agora — e é a mesma
 * no painel Imagens e no painel Topo, então vive num lugar só.
 */
export function heroDestaqueHint(office: Office): string {
  if (office.sectionImages.heroDestaque) {
    return "Esta imagem aparece no topo. Remova-a para voltar ao padrão.";
  }
  const lawyers = office.lawyers.length;
  if (lawyers === 1) {
    return "Vazio: o topo usa a foto do advogado. Escolha uma imagem para substituí-la.";
  }
  if (lawyers > 1) {
    return "Com mais de um advogado o topo não exibe retrato — destacar um só seria favoritismo. Escolha a imagem que entra no lugar.";
  }
  return "Imagem exibida ao lado do texto, no topo.";
}

/** Imagens das seções e fotos dos advogados em um único painel. */
export function ImagensPanel({ form }: { form: LpEditorForm }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Fotos dos advogados
        </p>
        <LawyerImageHint />
        <LawyerPhotosInput form={form} />
      </div>

      <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Imagens da página
        </p>
        <SectionImageInput
          form={form}
          sectionKey="hero"
          label="Fundo do topo"
        />
        <p className="text-xs text-ui-gray">{heroDestaqueHint(form.office)}</p>
        <SectionImageInput
          form={form}
          sectionKey="heroDestaque"
          label="Destaque do topo"
        />
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
