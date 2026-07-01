"use client";

import {
  Delete,
  Edit,
  OpenInNew,
  ProgressActivity,
} from "@material-symbols-svg/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteLpAction } from "@/app/actions/lps";
import { useLpAccess } from "@/components/lp-access-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { isAccessDeniedError } from "@/lib/errors";
import type { LpListPreview } from "@/lib/landing-pages/lp-preview";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import { showAccessDeniedToast } from "@/lib/toast";
import {
  LP_GALLERY_CARD_CLASS,
  LpLinkPreviewCard,
} from "./lp-link-preview-card";

type LpCardProps = {
  slug: string;
  name: string;
  status: "draft" | "published";
  preview: LpListPreview;
};

export function LpCard({ slug, name, status, preview }: LpCardProps) {
  const router = useRouter();
  const hasLpAccess = useLpAccess();
  const [excluindo, setExcluindo] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function pedirExclusao(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!hasLpAccess) {
      showAccessDeniedToast();
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
          throw new Error(res.error);
        }
        return;
      }
      setDeleteOpen(false);
      router.refresh();
    } catch {
      setExcluindo(false);
      toast.error("Não foi possível excluir", {
        description: "Tente de novo em instantes.",
      });
    }
  }

  const badge =
    status === "published" ? (
      <Badge variant="default">Publicada</Badge>
    ) : (
      <Badge variant="secondary">Rascunho</Badge>
    );

  return (
    <>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!excluindo) setDeleteOpen(open);
        }}
        title={`Excluir "${name}"?`}
        description="Esta ação não pode ser desfeita. A página e seus arquivos serão removidos permanentemente."
        confirmLabel="Excluir"
        variant="destructive"
        loading={excluindo}
        onConfirm={confirmarExclusao}
      />

      <LpLinkPreviewCard
        className={LP_GALLERY_CARD_CLASS}
        preview={preview}
        badge={badge}
        footer={
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="min-w-0 flex-1"
            >
              <Link href={`/lp/${slug}`}>
                <Edit size={14} />
                Editar
              </Link>
            </Button>
            {status === "published" ? (
              <Button asChild variant="outline" size="icon-sm">
                <a
                  href={publicLpUrl(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Abrir ${preview.host}`}
                  aria-label={`Abrir site publicado em ${preview.host}`}
                >
                  <OpenInNew size={14} />
                </a>
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                disabled
                title="Publique a página para abrir o site"
                aria-label="Site indisponível — página em rascunho"
              >
                <OpenInNew size={14} />
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              aria-label={`Excluir ${name}`}
              title="Excluir"
              onClick={pedirExclusao}
              disabled={excluindo}
            >
              {excluindo ? (
                <ProgressActivity size={14} className="animate-spin" />
              ) : (
                <Delete size={14} className="text-white" />
              )}
            </Button>
          </div>
        }
      />
    </>
  );
}
