"use client";

import { AddPhotoAlternate, Delete, Image } from "@material-symbols-svg/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GalleryImageDto,
  GalleryLandingPageDto,
} from "@/app/actions/gallery";
import {
  deleteGalleryImageAction,
  deleteOrphanedImagesAction,
  listGalleryImagesAction,
  uploadGalleryImageAction,
} from "@/app/actions/gallery";
import FilterIcon from "@/components/icons/filter-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { GalleryTableSkeleton } from "@/components/ui-patterns/skeletons";
import {
  GaleriaFilterForm,
  type GaleriaFilterValues,
} from "@/forms/GaleriaFilterForm";
import { useLpPermissions } from "@/hooks/use-lp-permissions";
import { useLpWriteAccess } from "@/hooks/use-lp-write-access";
import { isAccessDeniedError } from "@/lib/errors";
import {
  filterGalleryImages,
  GALLERY_ALL_LPS_VALUE,
} from "@/lib/landing-pages/gallery-filters";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import { showLpMessageError, showLpUpgradeToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const FILTER_FORM_ID = "galeria-filter-form";

const DEFAULT_FILTERS: GaleriaFilterValues = {
  origem: "all",
  lpSlug: GALLERY_ALL_LPS_VALUE,
};

function uniqueLandingPageUsages(usages: GalleryImageDto["usages"]) {
  return usages.filter(
    (usage, index, self) =>
      self.findIndex((item) => item.landingPageId === usage.landingPageId) ===
      index,
  );
}

function countAppliedFilters(
  filters: GaleriaFilterValues,
  allLpsValue: string,
): number {
  let count = 0;
  if (filters.origem !== "all") count += 1;
  if (filters.lpSlug && filters.lpSlug !== allLpsValue) count += 1;
  return count;
}

function filtersAreEqual(a: GaleriaFilterValues, b: GaleriaFilterValues) {
  return a.origem === b.origem && a.lpSlug === b.lpSlug;
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
  const [landingPages, setLandingPages] = useState<GalleryLandingPageDto[]>([]);
  const [appliedFilters, setAppliedFilters] =
    useState<GaleriaFilterValues>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<GaleriaFilterValues>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [confirmOrphanedDelete, setConfirmOrphanedDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { canDeleteImage, canManageAll, session } = useLpPermissions();
  const { guardWrite } = useLpWriteAccess();
  const accountImages = images.filter((img) => img.source === "account");

  const appliedFilterCount = useMemo(
    () => countAppliedFilters(appliedFilters, GALLERY_ALL_LPS_VALUE),
    [appliedFilters],
  );
  const hasAppliedFilters = appliedFilterCount > 0;
  const isFilterApplyDisabled = filtersAreEqual(draftFilters, appliedFilters);

  const filteredImages = useMemo(
    () =>
      filterGalleryImages(
        images,
        appliedFilters,
        session.user.id,
        GALLERY_ALL_LPS_VALUE,
      ),
    [images, appliedFilters, session.user.id],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listGalleryImagesAction();
    setLoading(false);
    if (res.ok) {
      setImages(res.images);
      setLandingPages(res.landingPages);
    } else {
      showLpMessageError(res.error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function applyFilters(values: GaleriaFilterValues) {
    setAppliedFilters(values);
    setDraftFilters(values);
  }

  function clearFilters() {
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  }

  async function onUpload(file: File) {
    if (!guardWrite()) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const res = await uploadGalleryImageAction(
        String(reader.result),
        file.name,
      );
      setUploading(false);
      if (!res.ok) {
        if (isAccessDeniedError(res.error)) showLpUpgradeToast(session);
        else showLpMessageError(res.error);
        return;
      }
      setImages((prev) => [res.image, ...prev]);
    };
    reader.readAsDataURL(file);
  }

  async function confirmDelete() {
    if (!deleteId || !guardWrite()) return;
    setDeleting(true);
    const res = await deleteGalleryImageAction(deleteId);
    setDeleting(false);
    if (!res.ok) {
      if (isAccessDeniedError(res.error)) showLpUpgradeToast(session);
      else showLpMessageError(res.error);
      return;
    }
    setImages((prev) => prev.filter((i) => i.id !== deleteId));
    setDeleteId(null);
  }

  async function handleConfirmOrphanedDelete() {
    if (!guardWrite()) return;
    setDeleting(true);
    const res = await deleteOrphanedImagesAction();
    setDeleting(false);
    setConfirmOrphanedDelete(false);
    if (!res.ok) {
      if (isAccessDeniedError(res.error)) showLpUpgradeToast(session);
      else showLpMessageError(res.error);
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
            {!loading && images.length > 0 ? (
              <Badge variant="secondary" size="sm" className="font-medium">
                {filteredImages.length}
              </Badge>
            ) : null}
          </HeaderHeading>
        </HeaderContent>
        <HeaderActions>
          <Popover
            onOpenChange={(open) => {
              if (open) setDraftFilters(appliedFilters);
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline-light"
                size="icon-lg"
                disabled={loading}
                className="relative"
              >
                <FilterIcon
                  className={cn(appliedFilterCount > 0 ? "text-primary" : "")}
                />
                {appliedFilterCount > 0 ? (
                  <Badge className="absolute -top-2 -right-2 ml-auto size-4 min-w-none shrink-0 rounded-full p-0 text-[10px] leading-0">
                    {appliedFilterCount}
                  </Badge>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="start" className="w-80 p-0">
              <div className="p-4">
                <GaleriaFilterForm
                  key={`${draftFilters.origem}-${draftFilters.lpSlug}`}
                  id={FILTER_FORM_ID}
                  values={draftFilters}
                  landingPages={landingPages}
                  allLpsValue={GALLERY_ALL_LPS_VALUE}
                  onValuesChange={setDraftFilters}
                  onSubmit={applyFilters}
                />
              </div>
              <div className="flex gap-2 border-t px-4 py-3">
                <Button
                  size="sm"
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  disabled={!hasAppliedFilters}
                  onClick={clearFilters}
                >
                  Limpar
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  form={FILTER_FORM_ID}
                  className="flex-1"
                  disabled={isFilterApplyDisabled}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            className="text-destructive hover:bg-destructive/10"
            disabled={deleting || accountImages.length === 0}
            onClick={() => {
              if (!guardWrite()) return;
              setConfirmOrphanedDelete(true);
            }}
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
            onClick={() => {
              if (!guardWrite()) return;
              fileRef.current?.click();
            }}
          >
            <AddPhotoAlternate />
            {uploading ? "Enviando…" : "Enviar imagem"}
          </Button>
        </HeaderActions>
      </Header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading ? (
          <GalleryTableSkeleton />
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Image className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma imagem na galeria da conta.
            </p>
            <Button
              type="button"
              onClick={() => {
                if (!guardWrite()) return;
                fileRef.current?.click();
              }}
            >
              Enviar primeira imagem
            </Button>
          </div>
        ) : filteredImages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma imagem com esses filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-14">Preview</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden sm:table-cell">Origem</TableHead>
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
                const canDelete = canDeleteImage(img.uploadedByUserId, inUse);
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
                          {!isOwner && !canManageAll ? " (proprietário)" : ""}
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
                                {publicLpUrl(usage.officeSubdomain, usage.slug)}
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
                          onClick={() => {
                            if (!guardWrite()) return;
                            setDeleteId(img.id);
                          }}
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
