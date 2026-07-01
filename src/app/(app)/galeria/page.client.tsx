"use client";

import { AddPhotoAlternate, Delete, Image } from "@material-symbols-svg/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GalleryImageDto } from "@/app/actions/gallery";
import {
  deleteGalleryImageAction,
  listGalleryImagesAction,
  uploadGalleryImageAction,
} from "@/app/actions/gallery";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Container } from "@/components/ui-patterns/container";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderHeading,
} from "@/components/ui-patterns/header";
import { useLpPermissions } from "@/hooks/use-lp-permissions";
import { showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function GalleryPageClient() {
  const [images, setImages] = useState<GalleryImageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { canDeleteImage, canManageAll, session } = useLpPermissions();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listGalleryImagesAction();
    setLoading(false);
    if (res.ok) setImages(res.images);
    else showLpMessageError(res.error);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUpload(file: File) {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await uploadGalleryImageAction(
        String(reader.result),
        file.name,
      );
      setUploading(false);
      if (!res.ok) {
        showLpMessageError(res.error);
        return;
      }
      setImages((prev) => [res.image, ...prev]);
    };
    reader.readAsDataURL(file);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const res = await deleteGalleryImageAction(deleteId);
    setDeleting(false);
    if (!res.ok) {
      showLpMessageError(res.error);
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  }

  return (
    <Container orientation="vertical" overflow="hidden">
      <Header>
        <HeaderContent>
          <HeaderHeading>
            <h1>Galeria de imagens</h1>
          </HeaderHeading>
        </HeaderContent>
        <HeaderActions>
          <Button asChild variant="outline">
            <Link href="/">Voltar às LPs</Link>
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUpload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            <AddPhotoAlternate />
            {uploading ? "Enviando…" : "Enviar imagem"}
          </Button>
        </HeaderActions>
      </Header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Image className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma imagem na galeria da conta.
            </p>
            <Button type="button" onClick={() => fileRef.current?.click()}>
              Enviar primeira imagem
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((img) => {
              const inUse = img.usages.length > 0;
              const isOwner = img.uploadedByUserId === session.user.id;
              const canDelete = canDeleteImage(img.uploadedByUserId, inUse);

              return (
                <article
                  key={img.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  {/* biome-ignore lint/a11y/useAltText: gallery thumbnail */}
                  <img
                    src={img.url}
                    alt=""
                    className="aspect-video w-full object-cover"
                  />
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-medium">
                      {img.originalFilename ?? "Sem nome"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enviado por <strong>{img.uploadedByName}</strong>
                      {!isOwner && !canManageAll ? " (proprietário)" : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {inUse ? (
                        <>
                          Usado em:{" "}
                          {img.usages.map((u, index) => (
                            <span key={u.landingPageId}>
                              {index > 0 ? ", " : null}
                              <Link
                                href={`/lp/${u.slug}`}
                                className="text-foreground underline-offset-2 hover:underline"
                              >
                                {u.name || u.slug}
                              </Link>
                            </span>
                          ))}
                        </>
                      ) : (
                        "Não utilizada"
                      )}
                    </p>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-destructive hover:text-destructive",
                          !canDelete && "invisible",
                        )}
                        disabled={!canDelete}
                        title={
                          inUse
                            ? "Não é possível excluir imagem em uso"
                            : !canDelete
                              ? "Você não pode excluir esta imagem"
                              : "Excluir"
                        }
                        onClick={() => setDeleteId(img.id)}
                      >
                        <Delete className="size-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!deleting && !open) setDeleteId(null);
        }}
        title="Excluir imagem?"
        description="A imagem será removida permanentemente da galeria."
        confirmLabel="Excluir"
        variant="destructive"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </Container>
  );
}
