"use client";

import { Delete, MoreVert, OpenInNew, Web } from "@material-symbols-svg/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteLpAction } from "@/app/actions/lps";
import { useLpAccess } from "@/components/lp-access-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  status: "draft" | "published";
  preview: LpListPreview;
  createdByUserId: string;
  createdByLabel?: string;
};

export function LpCard({
  slug,
  officeSubdomain,
  name,
  status,
  preview,
  createdByUserId,
  createdByLabel,
}: LpCardProps) {
  const router = useRouter();
  const hasLpAccess = useLpAccess();
  const { canDelete, canEdit } = useLpPermissions(createdByUserId);
  const [excluindo, setExcluindo] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const statusLabel = status === "published" ? "Publicada" : "Rascunho";
  const responsibleName = createdByLabel || "Usuário";

  function pedirExclusao() {
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

  async function confirmarExclusao(deleteEverything: boolean) {
    setExcluindo(true);
    try {
      const res = await deleteLpAction(slug, deleteEverything);
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
      showLpMessageError(
        "Não foi possível excluir. Tente de novo em instantes.",
      );
    } finally {
      setExcluindo(false);
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
      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!excluindo) setDeleteOpen(open);
        }}
      >
        <DialogContent showCloseButton={!excluindo}>
          <DialogHeader>
            <DialogTitle>Excluir &ldquo;{name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Escolha como deseja excluir esta landing page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-4">
            <button
              type="button"
              disabled={excluindo}
              onClick={() => void confirmarExclusao(false)}
              className="w-full rounded-lg border border-border px-4 py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <p className="font-medium text-foreground">
                Somente a landing page
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Remove apenas a página. Imagens, contatos e endereços vinculados
                são mantidos.
              </p>
            </button>
            <button
              type="button"
              disabled={excluindo}
              onClick={() => void confirmarExclusao(true)}
              className="w-full rounded-lg border border-destructive/40 px-4 py-3 text-left transition-colors hover:bg-destructive/10 disabled:opacity-50"
            >
              <p className="font-medium text-destructive">Tudo</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Remove a página e limpa imagens, contatos e endereços que não
                estejam em uso em outra LP.
              </p>
            </button>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={excluindo}
              onClick={() => setDeleteOpen(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                {preview.title || name}
              </h3>
              <p className="truncate text-xs text-muted-foreground sm:text-sm">
                {preview.host}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
              <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                Responsável
              </span>
              <span className="flex-1 truncate text-xs sm:text-sm">
                {responsibleName}
              </span>
            </div>
            <div className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[96px_minmax(0,1fr)]">
              <span className="shrink-0 text-xs text-muted-foreground sm:text-sm">
                Status
              </span>
              <Badge
                variant={status === "published" ? "secondary" : "muted"}
                size="default"
                className={cn(
                  "justify-self-start",
                  status === "published"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {statusLabel}
              </Badge>
            </div>
          </div>
        </button>

        <div className="absolute top-3 right-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8"
                aria-label={`Ações da landing page ${name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreVert className="size-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44"
              onClick={(event) => event.stopPropagation()}
            >
              {status === "published" ? (
                <DropdownMenuItem asChild>
                  <a
                    href={publicLpUrl(officeSubdomain, slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <OpenInNew className="size-4" />
                    Abrir publicada
                  </a>
                </DropdownMenuItem>
              ) : null}
              {status === "published" && canDelete ? (
                <DropdownMenuSeparator />
              ) : null}
              {canDelete ? (
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    pedirExclusao();
                  }}
                  disabled={excluindo}
                >
                  <Delete className="size-4" />
                  Excluir
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  );
}
