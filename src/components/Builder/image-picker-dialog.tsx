"use client";

import { AddPhotoAlternate, Close, Upload } from "@material-symbols-svg/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  listGalleryImagesAction,
  uploadGalleryImageAction,
} from "@/app/actions/gallery";
import type { GalleryImageDto } from "@/app/actions/gallery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ImagePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
};

export function ImagePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Escolher imagem",
}: ImagePickerDialogProps) {
  const [images, setImages] = useState<GalleryImageDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listGalleryImagesAction();
    setLoading(false);
    if (res.ok) setImages(res.images);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function onFile(file: File) {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      const res = await uploadGalleryImageAction(dataUrl, file.name);
      setUploading(false);
      if (!res.ok) {
        showLpMessageError(res.error);
        return;
      }
      setImages((prev) => [res.image, ...prev]);
      onSelect(res.image.url);
      onOpenChange(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Escolha uma imagem da galeria da conta ou envie uma nova.
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            {uploading ? "Enviando…" : "Enviar nova"}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Carregando galeria…
            </p>
          ) : images.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma imagem na galeria. Envie a primeira acima.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  className="group relative overflow-hidden rounded-lg border border-border text-left transition hover:ring-2 hover:ring-primary"
                  onClick={() => {
                    onSelect(img.url);
                    onOpenChange(false);
                  }}
                >
                  {/* biome-ignore lint/a11y/useAltText: decorative thumbnail in picker */}
                  <img
                    src={img.url}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="truncate text-xs font-medium text-white">
                      {img.originalFilename ?? "Imagem"}
                    </p>
                    <p className="truncate text-[10px] text-white/80">
                      {img.uploadedByName}
                      {img.usages.length > 0
                        ? ` · ${img.usages.length} uso(s)`
                        : ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

type LazyImageSlotProps = {
  src: string;
  label: string;
  onChange: (url: string) => void;
  onClear: () => void;
  className?: string;
  extraActions?: React.ReactNode;
};

/** Slot colapsado: preview + botão explícito para abrir galeria. */
export function LazyImageSlot({
  src,
  label,
  onChange,
  onClear,
  className,
  extraActions,
}: LazyImageSlotProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-3",
        className,
      )}
    >
      {src ? (
        <div className="relative min-w-0 max-w-full">
          {/* biome-ignore lint/a11y/useAltText: preview */}
          <img
            src={src}
            alt=""
            className="h-[120px] w-full rounded-lg object-cover ring-1 ring-slate-200"
          />
          <button
            type="button"
            aria-label="Remover imagem"
            onClick={onClear}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          >
            <Close size={14} />
          </button>
        </div>
      ) : (
        <div className="flex h-[120px] w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
          Sem imagem
        </div>
      )}

      <div className="mt-2.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="min-w-0 truncate text-sm font-medium text-slate-700">
          {label}
        </span>
        <div className="flex shrink-0 items-center gap-1.5 self-end">
          {extraActions}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            <AddPhotoAlternate className="size-4" />
            {src ? "Alterar imagem" : "Escolher imagem"}
          </Button>
        </div>
      </div>

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onChange}
        title={label}
      />
    </div>
  );
}
