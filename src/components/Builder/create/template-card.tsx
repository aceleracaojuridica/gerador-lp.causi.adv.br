import { CheckCircle } from "@material-symbols-svg/react";
import type { LpTemplate } from "@/lib/landing-pages/templates";
import { templatePreviewSrc } from "@/lib/landing-pages/templates";
import { GALLERY_CARD_CLASS, PageGalleryCard } from "./page-gallery-card";

type TemplateCardProps = {
  template: LpTemplate;
  selected?: boolean;
  onSelect?: () => void;
};

/** Card de seleção de preset de layout no wizard de criação. */
export function TemplateCard({
  template,
  selected,
  onSelect,
}: TemplateCardProps) {
  return (
    <PageGalleryCard
      className={GALLERY_CARD_CLASS}
      imageSrc={templatePreviewSrc(template.id)}
      imageAlt={`Prévia do modelo ${template.name}`}
      title={template.name}
      description={template.description}
      selected={selected}
      asButton
      onClick={onSelect}
      footer={
        selected ? (
          <span className="flex items-center gap-1 text-xs font-medium text-foreground">
            <CheckCircle size={14} /> Selecionado
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            Clique para selecionar
          </span>
        )
      }
    />
  );
}
