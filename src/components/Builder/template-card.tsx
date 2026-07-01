import { Add, CheckCircle } from "@material-symbols-svg/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { LpTemplate } from "@/lib/landing-pages/templates";
import { templatePreviewSrc } from "@/lib/landing-pages/templates";
import { GALLERY_CARD_CLASS, PageGalleryCard } from "./page-gallery-card";

type TemplateCardProps = {
  template: LpTemplate;
  variant?: "gallery" | "select";
  selected?: boolean;
  onSelect?: () => void;
};

export function TemplateCard({
  template,
  variant = "gallery",
  selected,
  onSelect,
}: TemplateCardProps) {
  const footer =
    variant === "select" ? (
      selected ? (
        <span className="flex items-center gap-1 text-xs font-medium text-foreground">
          <CheckCircle size={14} /> Selecionado
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          Clique para selecionar
        </span>
      )
    ) : (
      <Button asChild size="sm">
        <Link href={`/nova?template=${template.id}`}>
          <Add size={14} /> Usar modelo
        </Link>
      </Button>
    );

  return (
    <PageGalleryCard
      className={GALLERY_CARD_CLASS}
      imageSrc={templatePreviewSrc(template.id)}
      imageAlt={`Prévia do modelo ${template.name}`}
      title={template.name}
      description={template.description}
      selected={variant === "select" ? selected : undefined}
      asButton={variant === "select"}
      onClick={variant === "select" ? onSelect : undefined}
      footer={footer}
    />
  );
}
