"use client";

import {
  Add,
  Check,
  Close,
  OpenWith,
  ProgressActivity,
  Undo,
  WandStars,
} from "@material-symbols-svg/react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { ZoomableImage } from "@/components/zoomable-image";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import {
  type ImagemMelhorada,
  melhorarImagem,
} from "@/lib/landing-pages/melhorar-imagem";

const ComparePhotoModal = dynamic(
  () => import("./compare-photo-modal").then((m) => m.ComparePhotoModal),
  { ssr: false },
);

import type { Lawyer } from "@/lib/landing-pages/schema";

export const clampPct = (n: number) => Math.max(0, Math.min(100, n));

function FocalPicker({
  src,
  value,
  onChange,
}: {
  src: string;
  value: { x: number; y: number };
  onChange: (v: { x: number; y: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    fx: number;
    fy: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, fx: value.x, fy: value.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = ref.current;
    if (!d || !box) return;
    const r = box.getBoundingClientRect();
    const nx = clampPct(d.fx - ((e.clientX - d.sx) / r.width) * 100);
    const ny = clampPct(d.fy - ((e.clientY - d.sy) / r.height) * 100);
    onChange({ x: Math.round(nx), y: Math.round(ny) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="flex items-start gap-3">
        <div
          ref={ref}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative aspect-[3/4] w-28 shrink-0 cursor-move touch-none select-none overflow-hidden rounded-lg bg-lp-brand ring-1 ring-slate-300"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundSize: "cover",
            backgroundPosition: `${value.x}% ${value.y}%`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs text-slate-500">
            Arraste a foto para encaixar o rosto. O recorte vale para a página
            (topo, sobre e equipe).
          </p>
          <button
            type="button"
            onClick={() => onChange({ x: 50, y: 50 })}
            className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-700"
          >
            <Undo size={13} /> Centralizar
          </button>
        </div>
      </div>
    </div>
  );
}

function LawyerRow({
  form,
  lawyer,
  index,
}: {
  form: LpEditorForm;
  lawyer: Lawyer;
  index: number;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImagemMelhorada | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [framing, setFraming] = useState(false);

  async function melhorar() {
    setLoading(true);
    setError(null);
    try {
      setResult(await melhorarImagem(lawyer.photo));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao melhorar a foto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-3">
      <div className="relative min-w-0 max-w-full">
        <ZoomableImage
          src={lawyer.photo}
          alt={`advogado ${index + 1}`}
          className="h-[140px] w-full rounded-lg ring-1 ring-slate-200"
        />
        <button
          type="button"
          aria-label="Remover advogado"
          onClick={(e) => {
            e.stopPropagation();
            form.removeLawyerPhoto(index);
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <Close size={14} />
        </button>
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              melhorar();
            }}
            disabled={loading}
            title="Aumenta resolução e nitidez da foto, mantendo a pessoa"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ui-soft/95 px-2.5 py-1.5 text-xs font-medium text-ui shadow-sm backdrop-blur transition hover:bg-ui-soft disabled:opacity-60"
          >
            {loading ? (
              <ProgressActivity size={14} className="animate-spin" />
            ) : (
              <WandStars size={14} />
            )}
            {loading ? "Melhorando…" : "Melhorar foto"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFraming((v) => !v);
            }}
            aria-label="Enquadrar"
            title="Reposiciona a foto para o rosto não ser cortado"
            className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur transition ${
              framing
                ? "bg-ui-soft/95 text-ui"
                : "bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            <OpenWith size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Input
          aria-label={`Nome do advogado ${index + 1}`}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.name}
          onChange={(e) => form.setLawyerField(index, "name", e.target.value)}
          placeholder="Nome do advogado"
        />
        <Input
          aria-label={`Cargo do advogado ${index + 1}`}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.role}
          onChange={(e) => form.setLawyerField(index, "role", e.target.value)}
          placeholder="Cargo e OAB (ex: Sócio · OAB/SP 000)"
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {framing ? (
        <div className="mt-2">
          <FocalPicker
            src={lawyer.photo}
            value={lawyer.focal ?? { x: 50, y: 50 }}
            onChange={(v) => form.setLawyerFocal(index, v)}
          />
        </div>
      ) : null}

      {result ? (
        <ComparePhotoModal
          before={lawyer.photo}
          after={result.image}
          beforeDim={result.before}
          afterDim={result.after}
          onApply={() => {
            form.setLawyerPhoto(index, result.image);
            setResult(null);
          }}
          onDiscard={() => setResult(null)}
        />
      ) : null}
    </div>
  );
}

export function LawyerPhotosInput({ form }: { form: LpEditorForm }) {
  const ref = useRef<HTMLInputElement>(null);
  const lawyers = form.office.lawyers;
  return (
    <div className="flex flex-col gap-3">
      <Input
        ref={ref}
        type="file"
        multiple
        aria-label="Enviar fotos dos advogados"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) form.onAddLawyerPhotos(e.target.files);
          e.target.value = "";
        }}
      />
      {lawyers.length > 0 ? (
        <div className="flex flex-col gap-3">
          {lawyers.map((l, i) => (
            <LawyerRow key={i} form={form} lawyer={l} index={i} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-xs text-slate-400">
          Nenhum advogado cadastrado.
        </p>
      )}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
      >
        <Add size={16} />
        {lawyers.length > 0 ? "Adicionar mais" : "Adicionar advogados"}
      </button>
    </div>
  );
}
