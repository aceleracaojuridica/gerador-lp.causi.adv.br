"use client";

import { Delete, OpenInNew, Web } from "@material-symbols-svg/react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { deleteLpAction } from "@/app/actions/lps";
import { useLpAccess } from "@/components/lp-access-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLpPermissions } from "@/hooks/use-lp-permissions";
import { isAccessDeniedError } from "@/lib/errors";
import type { LpListPreview } from "@/lib/landing-pages/lp-preview";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import { showAccessDeniedToast, showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";

type LpCardProps = {
  slug: string;
  officeSubdomain: string;
  name: string;
  tema: string;
  status: "draft" | "published";
  preview: LpListPreview;
  createdByUserId: string;
  createdByLabel?: string;
  isOwnLp?: boolean;
};

export function LpCard({
  slug,
  officeSubdomain,
  name,
  tema,
  status,
  preview,
  createdByUserId,
  createdByLabel,
  isOwnLp,
}: LpCardProps) {
  const router = useRouter();
  const hasLpAccess = useLpAccess();
  const { canDelete, canEdit, session } = useLpPermissions(createdByUserId);
  const [excluindo, setExcluindo] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statusLabel = status === "published" ? "Publicada" : "Rascunho";
  const showCreator =
    createdByLabel && createdByUserId !== session.user.id && !isOwnLp;

  function pedirExclusao(event: React.MouseEvent) {
    event.stopPropagation();
    if (!hasLpAccess) {
      showAccessDeniedToast();
      return;
    }
    if (!canDelete) {
      showLpMessageError(
        "Somente o proprietário da conta pode excluir landing pages.",
      );
      return;
    }
    setDeleteOpen(true);
  }

  async function confirmarExclusao() {
    setExcluindo(true);
    try {
      const res = await deleteLpAction(slug);
      if ("error" in res) {
        if (isAccessDeniedError(res.error)) {
          showAccessDeniedToast();
        } else {
          showLpMessageError(res.error);
        }
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setExcluindo(false);
      showLpMessageError(
        "Não foi possível excluir. Tente de novo em instantes.",
      );
    }
  }

  function openEditor() {
    if (!canEdit) {
      showLpMessageError("Você só pode editar landing pages que você criou.");
      return;
    }
    router.push(`/lp/${slug}`);
  }

  return (
    <>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!excluindo) setDeleteOpen(open);
        }}
        title={`Excluir "${name}"?`}
        description="Esta ação não pode ser desfeita. A página será removida permanentemente."
        confirmLabel="Excluir"
        variant="destructive"
        loading={excluindo}
        onConfirm={confirmarExclusao}
      />

      <div className="group relative w-full shrink-0 sm:w-[300px]">
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
          onClick={openEditor}
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border-6 border-border bg-primary/10 sm:size-12">
              <Web className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-0.5 truncate text-base font-semibold text-foreground sm:mb-1 sm:text-lg">
                {name}
              </h3>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {preview.host}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            {showCreator ? (
              <div className="flex items-center gap-2">
                <span className="w-12 shrink-0 text-xs text-muted-foreground sm:w-14 sm:text-sm">
                  Criador
                </span>
                <span className="flex-1 truncate text-xs sm:text-sm">
                  {createdByLabel}
                </span>
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground sm:w-14 sm:text-sm">
                Tema
              </span>
              <span
                className={cn(
                  "flex-1 truncate text-xs sm:text-sm",
                  tema ? "font-regular" : "text-muted-foreground/40",
                )}
              >
                {tema || "Não definido"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-xs text-muted-foreground sm:w-14 sm:text-sm">
                Status
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-xs font-medium sm:px-2 sm:py-1",
                  status === "published"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </button>

        <div className="absolute top-3 right-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {status === "published" ? (
            <Button asChild variant="ghost" size="icon-sm" className="h-8 w-8">
              <a
                href={publicLpUrl(officeSubdomain, slug)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Abrir ${preview.host}`}
                aria-label={`Abrir site publicado em ${preview.host}`}
                onClick={(event) => event.stopPropagation()}
              >
                <OpenInNew className="size-5 text-muted-foreground" />
              </a>
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Excluir ${name}`}
              title="Excluir"
              onClick={pedirExclusao}
              disabled={excluindo}
            >
              <Delete className="size-5 text-muted-foreground group-hover:text-destructive" />
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
