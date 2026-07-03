"use client";

import type { ReactNode } from "react";
import { SectionVariantControls } from "./section-variant-carousel";

export type VariantOption = {
  id: string;
  label: string;
  thumb: ReactNode; // mini-wireframe esquemático
};

/** Troca rápida da variação da seção via setas ← →, com miniatura da variante atual. */
export function VariantPicker({
  options,
  value,
  onChange,
}: {
  options: VariantOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const variants = options.map((o) => o.id);
  const variantLabels = Object.fromEntries(options.map((o) => [o.id, o.label]));
  const thumb = options.find((o) => o.id === value)?.thumb;

  return (
    <SectionVariantControls
      label="Variação"
      variants={variants}
      variantLabels={variantLabels}
      current={value}
      onChange={onChange}
      thumb={thumb}
    />
  );
}

/* ===== Mini-wireframes (esquemáticos, neutros) ===== */
// paleta neutra fixa para os thumbs; não reflete o tema da LP, só a estrutura.
const bar = "rounded-sm bg-slate-300";
const dark = "bg-slate-700";
const gold = "bg-amber-400";

export const HERO_THUMBS: Record<string, ReactNode> = {
  centered: (
    <div className="flex h-full flex-col items-center justify-center gap-1 p-2">
      <div className={`h-1 w-5 ${gold} rounded-sm`} />
      <div className={`h-1.5 w-12 ${bar}`} />
      <div className={`h-1.5 w-10 ${bar}`} />
      <div className={`mt-1 h-2 w-6 rounded-sm ${dark}`} />
    </div>
  ),
  split: (
    <div className="flex h-full">
      <div className={`flex w-1/2 flex-col justify-center gap-1 p-2 ${dark}`}>
        <div className="h-1 w-6 rounded-sm bg-amber-300" />
        <div className="h-1.5 w-8 rounded-sm bg-white/70" />
        <div className="h-1.5 w-6 rounded-sm bg-white/40" />
      </div>
      <div className="w-1/2 bg-slate-400" />
    </div>
  ),
  video: (
    <div className="flex h-full gap-1.5 p-2">
      <div className="flex w-3/5 flex-col justify-center gap-1">
        <div className={`h-1.5 w-10 ${bar}`} />
        <div className="flex h-6 items-center justify-center rounded bg-slate-400">
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-400">
            <div className="ml-px h-0 w-0 border-y-[2px] border-l-[3px] border-y-transparent border-l-slate-800" />
          </div>
        </div>
      </div>
      <div className="w-2/5 rounded bg-slate-500" />
    </div>
  ),
  stats: (
    <div className="flex h-full gap-1.5 p-2" style={{ background: "#3f4b66" }}>
      <div className="flex w-3/5 flex-col justify-center gap-1">
        <div className="h-1.5 w-10 rounded-sm bg-white/70" />
        <div className="h-1.5 w-8 rounded-sm bg-white/40" />
        <div className="mt-1 flex gap-1">
          <div className="h-2 w-3 rounded-sm bg-amber-300" />
          <div className="h-2 w-3 rounded-sm bg-amber-300" />
          <div className="h-2 w-3 rounded-sm bg-amber-300" />
        </div>
      </div>
      <div className="w-2/5 rounded border border-amber-400 bg-slate-500" />
    </div>
  ),
};

// thumbs neutros (só estrutura/layout; a cor vem do toggle de tom, à parte)
export const DOR_THUMBS: Record<string, ReactNode> = {
  comImagem: (
    <div className="flex h-full flex-col gap-1 p-2">
      <div className="flex gap-1.5">
        <div className="flex w-1/2 flex-col gap-1">
          <div className={`h-1.5 w-8 ${bar}`} />
          <div className={`h-1 w-6 ${bar}`} />
        </div>
        <div className="h-5 w-1/2 rounded bg-slate-400" />
      </div>
      <div className="mt-auto flex gap-1">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className="h-3 flex-1 rounded-sm bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
    </div>
  ),
  soCards: (
    <div className="flex h-full flex-col items-center gap-1 p-2">
      <div className={`h-1 w-5 ${gold} rounded-sm`} />
      <div className={`h-1.5 w-10 ${bar}`} />
      <div className="mt-auto flex w-full gap-1">
        {[0, 1, 2].map((k) => (
          <div
            key={k}
            className="h-3 flex-1 rounded-sm bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
    </div>
  ),
};

export const SOLUCAO_THUMBS: Record<string, ReactNode> = {
  comImagem: (
    <div className="flex h-full flex-col gap-1 p-2">
      <div className="flex gap-1.5">
        <div className="flex w-1/2 flex-col gap-1">
          <div className={`h-1.5 w-8 ${bar}`} />
          <div className={`h-1 w-6 ${bar}`} />
        </div>
        <div className="h-5 w-1/2 rounded bg-slate-400" />
      </div>
      <div className="mt-auto flex gap-1">
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            className="h-3 flex-1 rounded-sm border-t-2 border-amber-400 bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
    </div>
  ),
  soCards: (
    <div className="flex h-full flex-col items-center gap-1 p-2">
      <div className={`h-1.5 w-10 ${bar}`} />
      <div className="mt-auto flex w-full gap-1">
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            className="h-4 flex-1 rounded-sm border-t-2 border-amber-400 bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
    </div>
  ),
  destaque: (
    <div className="flex h-full flex-col items-center gap-1 p-2">
      <div className={`h-1.5 w-10 ${bar}`} />
      <div className="mt-auto flex w-full gap-1">
        {[0, 1, 2, 3].map((k) => (
          <div
            key={k}
            className={`h-4 flex-1 rounded-sm ${
              k % 2 === 0
                ? "bg-amber-400"
                : "border-t-2 border-amber-400 bg-white ring-1 ring-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  ),
};

export const SOBRE_THUMBS: Record<string, ReactNode> = {
  overlay: (
    <div className="relative flex h-full items-center bg-slate-500 p-2">
      <div className="flex w-3/5 flex-col gap-1">
        <div className="h-1 w-6 rounded-sm bg-amber-300" />
        <div className="h-1.5 w-10 rounded-sm bg-white/80" />
        <div className="h-1.5 w-8 rounded-sm bg-white/50" />
        <div className="mt-1 h-2 w-6 rounded-sm bg-amber-400" />
      </div>
      <div className="ml-auto h-12 w-1/4 rounded border-2 border-amber-400 bg-slate-400" />
    </div>
  ),
  duasColunas: (
    <div className="flex h-full gap-1.5 bg-white p-0">
      <div className="w-2/5 bg-slate-400" />
      <div className="flex w-3/5 flex-col justify-center gap-1 p-2">
        <div className={`h-1.5 w-10 ${bar}`} />
        <div className={`h-1 w-12 ${bar}`} />
        <div className={`h-1 w-9 ${bar}`} />
      </div>
    </div>
  ),
  fotoLista: (
    <div className="flex h-full gap-1.5 bg-white p-2">
      <div className="w-2/5 rounded bg-slate-400" />
      <div className="flex w-3/5 flex-col justify-center gap-1">
        <div className={`h-1.5 w-10 ${bar}`} />
        <div
          className={`flex items-center gap-1 rounded-sm ${dark} px-1 py-0.5`}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          <div className="h-1 w-7 rounded-sm bg-white/70" />
        </div>
        <div className="flex items-center gap-1 rounded-sm bg-slate-100 px-1 py-0.5 ring-1 ring-slate-200">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <div className={`h-1 w-6 ${bar}`} />
        </div>
      </div>
    </div>
  ),
};

export const ETAPAS_THUMBS: Record<string, ReactNode> = {
  numerado: (
    <div className="flex h-full items-center justify-center gap-2 p-2">
      {[0, 1, 2, 3].map((k) => (
        <div key={k} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`flex h-4 w-4 items-center justify-center rounded-full ${gold}`}
          />
          <div className={`h-1 w-5 ${bar}`} />
        </div>
      ))}
    </div>
  ),
  timeline: (
    <div className="flex h-full gap-2 p-2">
      <div className="flex w-2/5 flex-col justify-center gap-1">
        <div className={`h-1.5 w-9 ${bar}`} />
        <div className={`h-1.5 w-7 ${bar}`} />
      </div>
      <div className="flex w-3/5 flex-col justify-center gap-1.5 border-l-2 border-amber-300 pl-2">
        {[0, 1, 2].map((k) => (
          <div key={k} className="flex items-center gap-1">
            <div className="-ml-[0.7rem] h-1.5 w-1.5 rounded-full bg-amber-400" />
            <div className={`h-1 w-8 ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  ),
};

export const AREAS_THUMBS: Record<string, ReactNode> = {
  grid: (
    <div className={`grid h-full grid-cols-2 gap-1 p-2 ${dark}`}>
      {[0, 1, 2, 3].map((k) => (
        <div key={k} className="rounded-sm bg-white" />
      ))}
    </div>
  ),
  lista: (
    <div className={`flex h-full flex-col justify-center gap-1 p-2 ${dark}`}>
      {[0, 1, 2].map((k) => (
        <div key={k} className="h-2.5 w-full rounded-sm bg-white" />
      ))}
    </div>
  ),
};

export const EQUIPE_THUMBS: Record<string, ReactNode> = {
  splitAlternado: (
    // Foto grande de um lado, texto do outro, alternando por membro
    <div className="flex h-full flex-col justify-center gap-1.5 p-2">
      {[0, 1].map((k) => (
        <div
          key={k}
          className={`flex items-center gap-1.5 ${k % 2 === 1 ? "flex-row-reverse" : ""}`}
        >
          <div className="h-5 w-2/5 rounded-sm bg-slate-400" />
          <div className="flex w-3/5 flex-col gap-0.5">
            <div className={`h-1 w-1 rounded-full ${gold}`} />
            <div className={`h-1 w-8 ${bar}`} />
            <div className={`h-1 w-5 ${bar}`} />
          </div>
        </div>
      ))}
    </div>
  ),
  retratoElegante: (
    // Grid de retratos altos com gradiente na base e nome
    <div className="grid h-full grid-cols-3 gap-1 p-2">
      {[0, 1, 2].map((k) => (
        <div
          key={k}
          className="relative overflow-hidden rounded-sm bg-slate-400"
        >
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-slate-700 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-0.5">
            <div className="mb-px h-px w-2 bg-amber-400" />
            <div className="h-px w-4 rounded-sm bg-white/80" />
          </div>
        </div>
      ))}
    </div>
  ),
};
