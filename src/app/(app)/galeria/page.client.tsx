"use client";

import { AddPhotoAlternate, Delete, Image } from "@material-symbols-svg/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryImageDto } from "@/app/actions/gallery";
import {
  deleteGalleryImageAction,
  deleteOrphanedImagesAction,
  listGalleryImagesAction,
  uploadGalleryImageAction,
} from "@/app/actions/gallery";
import { GalleryImageFilterBar } from "@/components/gallery/gallery-image-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Container } from "@/components/ui-patterns/container";
import {
  Header,
  HeaderActions,
  HeaderContent,
  HeaderHeading,
} from "@/components/ui-patterns/header";
import { useLpPermissions } from "@/hooks/use-lp-permissions";
import {
  filterGalleryImages,
  type GalleryImageFilter,
} from "@/lib/landing-pages/gallery-filters";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import { showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";

function uniqueLandingPageUsages(usages: GalleryImageDto["usages"]) {
  return usages.filter(
    (usage, index, self) =>
      self.findIndex((item) => item.landingPageId === usage.landingPageId) ===
      index,
  );
}

function GalleryPreview({ url, isSystem }: { url: string; isSystem: boolean }) {
  return (
    // biome-ignore lint/performance/noImgElement: miniatura da galeria
    <img
      src={url}
      alt=""
      className={cn(
        "rounded object-cover ring-1 ring-border",
        isSystem ? "size-8 opacity-80" : "size-10",
      )}
    />
  );
}

export function GalleryPageClient() {
  const [images, setImages] = useState<GalleryImageDto[]>([]);
  const [filter, setFilter] = useState<GalleryImageFilter>("all");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOrphanedDelete, setConfirmOrphanedDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { canDeleteImage, canManageAll, session } = useLpPermissions();
  const accountImages = images.filter((img) => img.source === "account");

  const filteredImages = useMemo(
    () => filterGalleryImages(images, filter, session.user.id),
    [images, filter, session.user.id],
  );

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

  async function handleConfirmOrphanedDelete() {
    setDeleting(true);
    const res = await deleteOrphanedImagesAction();
    setDeleting(false);
    setConfirmOrphanedDelete(false);
    if (!res.ok) {
      showLpMessageError(res.error);
      return;
    }
    void load();
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
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            disabled={deleting || accountImages.length === 0}
            onClick={() => setConfirmOrphanedDelete(true)}
          >
            Limpar não utilizadas
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
          <div className="space-y-4">
            <GalleryImageFilterBar value={filter} onValueChange={setFilter} />

            {filteredImages.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma imagem para este filtro.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14">Preview</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Origem
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Enviado por
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Uso</TableHead>
                    <TableHead className="w-20 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredImages.map((img) => {
                    const isSystem = img.source === "system";
                    const inUse = img.usages.length > 0;
                    const isOwner = img.uploadedByUserId === session.user.id;
                    const canDelete = canDeleteImage(
                      img.uploadedByUserId,
                      inUse,
                    );
                    const uniqueUsages = uniqueLandingPageUsages(img.usages);

                    return (
                      <TableRow
                        key={img.id}
                        className={cn(isSystem && "text-muted-foreground")}
                      >
                        <TableCell>
                          <GalleryPreview url={img.url} isSystem={isSystem} />
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p
                            className={cn(
                              "truncate font-medium",
                              isSystem ? "text-sm" : "text-foreground",
                            )}
                          >
                            {img.originalFilename ??
                              (isSystem ? "Imagem do sistema" : "Sem nome")}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:hidden">
                            <Badge
                              variant={isSystem ? "outline" : "secondary"}
                              className="text-[10px]"
                            >
                              {isSystem ? "Sistema" : "Conta"}
                            </Badge>
                            {!isSystem ? (
                              <span className="text-[11px] text-muted-foreground">
                                {img.uploadedByName}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge
                            variant={isSystem ? "outline" : "secondary"}
                            className="text-[10px]"
                          >
                            {isSystem ? "Sistema" : "Conta"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden max-w-[160px] truncate md:table-cell">
                          {isSystem ? (
                            <span className="text-xs">—</span>
                          ) : (
                            <>
                              {img.uploadedByName}
                              {!isOwner && !canManageAll
                                ? " (proprietário)"
                                : ""}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="hidden max-w-[280px] lg:table-cell">
                          {isSystem ? (
                            <span className="text-xs">
                              Disponível para todos os escritórios
                            </span>
                          ) : inUse ? (
                            <span className="whitespace-normal text-xs">
                              Usado em:{" "}
                              {uniqueUsages.map((usage, index) => (
                                <span key={usage.landingPageId}>
                                  {index > 0 ? ", " : null}
                                  <Link
                                    href={publicLpUrl(
                                      usage.officeSubdomain,
                                      usage.slug,
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-foreground underline-offset-2 hover:underline"
                                  >
                                    {publicLpUrl(
                                      usage.officeSubdomain,
                                      usage.slug,
                                    )}
                                  </Link>
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className="text-xs">Não utilizada</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSystem ? null : (
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
                              <span className="sr-only">Excluir</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
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
      <ConfirmDialog
        open={confirmOrphanedDelete}
        onOpenChange={(open) => {
          if (!deleting && !open) setConfirmOrphanedDelete(false);
        }}
        title="Apagar imagens não utilizadas?"
        description="Todas as imagens da conta que não estão vinculadas a nenhuma landing page serão excluídas permanentemente."
        confirmLabel="Apagar todas"
        variant="destructive"
        loading={deleting}
        onConfirm={handleConfirmOrphanedDelete}
      />
    </Container>
  );
}
