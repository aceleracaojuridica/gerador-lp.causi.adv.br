"use client";

import {
  Add,
  AddPhotoAlternate,
  Check,
  Close,
  OpenWith,
  ProgressActivity,
  Undo,
  WandStars,
} from "@material-symbols-svg/react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AutoTextarea } from "@/components/auto-textarea";
import { ImagePickerDialog } from "@/components/Builder/shared/image-picker-dialog";
import { Input } from "@/components/ui/input";
import { ZoomableImage } from "@/components/zoomable-image";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import {
  type ImagemMelhorada,
  melhorarImagem,
} from "@/lib/landing-pages/melhorar-imagem";
import { useStableListKeys } from "../use-stable-list-keys";
import { FocalDragSurface } from "./focal-drag-surface";

const ComparePhotoModal = dynamic(
  () => import("./compare-photo-modal").then((m) => m.ComparePhotoModal),
  { ssr: false },
);

import type { Lawyer } from "@/lib/landing-pages/schema";

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
  const [pickerOpen, setPickerOpen] = useState(false);

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
    <div className="min-w-0 max-w-full rounded-xl border border-border bg-card p-3">
      <div className="relative min-w-0 max-w-full">
        {framing ? (
          <FocalDragSurface
            src={lawyer.photo}
            value={lawyer.focal ?? { x: 50, y: 50 }}
            onChange={(v) => form.setLawyerFocal(index, v)}
            className="h-[140px] w-full rounded-lg ring-2 ring-ui"
          />
        ) : (
          <ZoomableImage
            src={lawyer.photo}
            alt={`advogado ${index + 1}`}
            position="top"
            className="h-[140px] w-full rounded-lg ring-1 ring-border"
          />
        )}

        {framing ? (
          <span className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-medium text-white backdrop-blur">
            Arraste para encaixar o rosto
          </span>
        ) : (
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
        )}

        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          {framing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                form.setLawyerFocal(index, { x: 50, y: 50 });
              }}
              title="Centralizar o enquadramento"
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <Undo size={14} /> Centralizar
            </button>
          ) : (
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
          )}
          {!framing ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen(true);
              }}
              aria-label="Trocar foto"
              title="Escolher outra foto: da galeria, do catálogo do sistema ou enviando uma nova"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
            >
              <AddPhotoAlternate size={16} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFraming((v) => !v);
            }}
            aria-label={framing ? "Concluir enquadramento" : "Enquadrar"}
            title={
              framing
                ? "Concluir o enquadramento"
                : "Reposiciona a foto para o rosto não ser cortado"
            }
            // Enquadrando, o botão vira "concluir": verde de confirmação, não a
            // cor da marca — que é a mesma do estado de repouso e não sinaliza nada.
            className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur transition ${
              framing
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-white/90 text-slate-700 hover:bg-white"
            }`}
          >
            {framing ? <Check size={16} /> : <OpenWith size={16} />}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Input
          aria-label={`Nome do advogado ${index + 1}`}
          className="w-full rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-foreground outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.name}
          onChange={(e) => form.setLawyerField(index, "name", e.target.value)}
          placeholder="Nome do advogado"
        />
        <AutoTextarea
          aria-label={`Descrição do advogado ${index + 1}`}
          className="w-full resize-y rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.role}
          onChange={(e) => form.setLawyerField(index, "role", e.target.value)}
          placeholder="Cargo e OAB (ex: Sócio · OAB/SP 000)"
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title={lawyer.name ? `Foto de ${lawyer.name}` : "Foto do advogado"}
        onSelect={(url) => {
          form.setLawyerPhoto(index, url);
          // Outra pessoa, outro rosto: o enquadramento antigo não vale mais.
          form.setLawyerFocal(index, { x: 50, y: 50 });
        }}
      />

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
  // Sem isso, cada tecla no nome/cargo muda a key, remonta a linha e o input
  // perde o foco — só dava para digitar um caractere por vez.
  const lawyerKeys = useStableListKeys(
    lawyers,
    (l) => `${l.photo}::${l.name}::${l.role}`,
    "lawyer",
  );
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
            <LawyerRow key={lawyerKeys[i]} form={form} lawyer={l} index={i} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">
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
