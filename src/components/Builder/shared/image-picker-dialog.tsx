"use client";

import { AddPhotoAlternate, Close, Upload } from "@material-symbols-svg/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryImageDto } from "@/app/actions/gallery";
import {
  listGalleryImagesAction,
  uploadGalleryImageAction,
} from "@/app/actions/gallery";
import { GalleryImageFilterBar } from "@/components/gallery/gallery-image-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLpPermissions } from "@/hooks/use-lp-permissions";
import {
  filterGalleryImages,
  type GalleryImageFilter,
} from "@/lib/landing-pages/gallery-filters";
import { showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";

type ImagePickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
  title?: string;
};

function PickerPreview({ url, isSystem }: { url: string; isSystem: boolean }) {
  return (
    // biome-ignore lint/performance/noImgElement: miniatura simples de biblioteca interna
    <img
      src={url}
      alt=""
      className={cn(
        "shrink-0 rounded object-cover ring-1 ring-border",
        isSystem ? "size-10 opacity-80" : "size-12",
      )}
    />
  );
}

export function ImagePickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Escolher imagem",
}: ImagePickerDialogProps) {
  const [images, setImages] = useState<GalleryImageDto[]>([]);
  const [filter, setFilter] = useState<GalleryImageFilter>("all");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { session } = useLpPermissions();

  const filteredImages = useMemo(
    () => filterGalleryImages(images, filter, session.user.id),
    [images, filter, session.user.id],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listGalleryImagesAction();
    setLoading(false);
    if (res.ok) setImages(res.images);
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) setFilter("all");
  }, [open]);

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
      <DialogContent className="flex max-h-[85vh] max-w-lg flex-col overflow-hidden p-0">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Escolha uma imagem da sua galeria ou do catálogo do sistema.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex shrink-0 flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
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
              className="w-full sm:w-auto"
            >
              <Upload className="size-4" />
              {uploading ? "Enviando…" : "Enviar nova"}
            </Button>
          </div>

          <GalleryImageFilterBar value={filter} onValueChange={setFilter} />

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Carregando galeria…
              </div>
            ) : images.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma imagem na galeria. Envie a primeira acima.
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhuma imagem para este filtro.
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-lg border border-border">
                {filteredImages.map((img) => {
                  const isSystem = img.source === "system";

                  return (
                    <li key={img.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-accent/50",
                          isSystem && "text-muted-foreground",
                        )}
                        onClick={() => {
                          onSelect(img.url);
                          onOpenChange(false);
                        }}
                      >
                        <PickerPreview url={img.url} isSystem={isSystem} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "truncate font-medium",
                                isSystem
                                  ? "text-sm"
                                  : "text-sm text-foreground",
                              )}
                            >
                              {img.originalFilename ??
                                (isSystem ? "Imagem do sistema" : "Imagem")}
                            </p>
                            <Badge
                              variant={isSystem ? "outline" : "secondary"}
                              className="shrink-0 text-[10px]"
                            >
                              {isSystem ? "Sistema" : "Conta"}
                            </Badge>
                          </div>
                          {!isSystem ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {img.uploadedByName}
                              {img.usages.length > 0
                                ? ` · ${img.usages.length} uso(s)`
                                : ""}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Catálogo compartilhado
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogBody>
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
  /** Conteúdo sobreposto ao preview (ex.: superfície de enquadramento). */
  overlay?: React.ReactNode;
};

/** Slot colapsado: preview + botão explícito para abrir galeria. */
export function LazyImageSlot({
  src,
  label,
  onChange,
  onClear,
  className,
  extraActions,
  overlay,
}: LazyImageSlotProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div
      className={cn(
        "min-w-0 max-w-full rounded-[5px] border border-border bg-card p-3",
        className,
      )}
    >
      {/* Label acima da imagem, com o "remover" no mesmo nível (à direita).
          Full width, então o texto não é mais cortado como quando dividia a
          linha com os botões. */}
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium text-foreground">
          {label}
        </p>
        {src ? (
          <button
            type="button"
            aria-label="Remover imagem"
            onClick={onClear}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <Close size={14} />
          </button>
        ) : null}
      </div>

      {src ? (
        <div className="relative min-w-0 max-w-full">
          {/* biome-ignore lint/performance/noImgElement: preview local no builder */}
          <img
            src={src}
            alt=""
            className="h-[120px] w-full rounded-[5px] object-cover ring-1 ring-border"
          />
          {overlay}
        </div>
      ) : (
        <div className="flex h-[120px] w-full items-center justify-center rounded-[5px] border border-dashed border-border bg-muted/40 text-xs text-muted-foreground">
          Sem imagem
        </div>
      )}

      {/* Ações em largura total, lado a lado. `[&>button]` alcança tanto o
          <Button> daqui quanto o botão cru de `extraActions` (ex.: "IA escolhe"). */}
      <div
        className={cn(
          "mt-2.5 grid gap-1.5 [&>button]:w-full [&>button]:justify-center [&>button]:rounded-[5px]",
          extraActions ? "grid-cols-2" : "grid-cols-1",
        )}
      >
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

      <ImagePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onChange}
        title={label}
      />
    </div>
  );
}
