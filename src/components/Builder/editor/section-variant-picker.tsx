"use client";

import { SectionVariantControls } from "../shared/section-variant-carousel";
import type { PreviewVariantControl } from "./constants";

type SectionVariantPickerProps = {
  control: PreviewVariantControl;
  /** Barra compacta para o cabeçalho do preview; miniatura abaixo no painel CMS. */
  compact?: boolean;
};

/** Seletor de layout da seção — visível no painel CMS e no cabeçalho do preview. */
export function SectionVariantPicker({
  control,
  compact = false,
}: SectionVariantPickerProps) {
  const variantLabels = Object.fromEntries(
    control.options.map((option) => [option.id, option.label]),
  );
  const thumb = control.options.find(
    (option) => option.id === control.value,
  )?.thumb;

  return (
    <SectionVariantControls
      label={control.label}
      variants={control.options.map((option) => option.id)}
      variantLabels={variantLabels}
      current={control.value}
      onChange={control.onChange}
      thumb={thumb}
      thumbPlacement={compact ? "inline" : "below"}
      className={compact ? undefined : "w-full max-w-full"}
    />
  );
}
