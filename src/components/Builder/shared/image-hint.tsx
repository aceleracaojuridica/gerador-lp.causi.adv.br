import { Lightbulb } from "@material-symbols-svg/react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Aviso destacado (discreto) com recomendação para upload de imagem. */
export function ImageHint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] leading-snug text-amber-900",
        className,
      )}
    >
      <Lightbulb size={14} className="mt-px shrink-0 text-amber-500" />
      <p>{children}</p>
    </div>
  );
}

/** Recomendação de imagem para a logo do escritório. */
export function LogoImageHint({ className }: { className?: string }) {
  return (
    <ImageHint className={className}>
      <strong className="font-semibold">Recomendado:</strong> 1200 × 1300 px, de
      preferência PNG sem fundo (transparente).
    </ImageHint>
  );
}

/** Recomendação de imagem para as fotos dos advogados. */
export function LawyerImageHint({ className }: { className?: string }) {
  return (
    <ImageHint className={className}>
      <strong className="font-semibold">Recomendado:</strong> 700 × 900 px, foto
      bem recortada e sem muito espaço nas laterais.
    </ImageHint>
  );
}
