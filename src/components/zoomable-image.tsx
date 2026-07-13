"use client";

import { Close } from "@material-symbols-svg/react/rounded";
import NextImage from "next/image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Miniatura que, ao clicar, abre a imagem em tela cheia (lightbox) para o
 * usuário ver melhor. Clicar no fundo escuro (ou no X) fecha.
 *
 * O tamanho vem do `className` no wrapper interno (ex.: `h-[120px] w-full`).
 * `fill` fica no wrapper, não no botão — evita estourar o painel do editor.
 */
export function ZoomableImage({
  src,
  alt,
  className = "",
  fit = "cover",
  position = "center",
}: {
  src: string;
  alt: string;
  className?: string;
  fit?: "cover" | "contain";
  /** Âncora do recorte. "top" evita cortar a cabeça em retratos baixos. */
  position?: "center" | "top";
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Ampliar: ${alt}`}
        title="Clique para ampliar"
        onClick={() => setOpen(true)}
        className="block w-full max-w-full cursor-zoom-in border-0 bg-transparent p-0"
      >
        <div className={cn("relative overflow-hidden bg-slate-100", className)}>
          <NextImage
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes="(max-width: 480px) 100vw, 480px"
            className={cn(
              fit === "contain" ? "object-contain" : "object-cover",
              position === "top" && "object-top",
            )}
          />
        </div>
      </button>

      <dialog
        ref={dialogRef}
        aria-label={alt}
        onClose={() => setOpen(false)}
        className="fixed inset-0 z-[100] m-0 hidden h-full max-h-none w-full max-w-none border-0 bg-transparent p-6 backdrop:bg-black/75 open:flex open:items-center open:justify-center"
      >
        <form method="dialog" className="absolute inset-0">
          <button
            type="submit"
            aria-label="Fechar preview"
            className="h-full w-full cursor-default bg-transparent"
          />
        </form>
        <NextImage
          src={src}
          alt={alt}
          width={1600}
          height={1200}
          unoptimized
          className="pointer-events-none relative z-10 max-h-[calc(100dvh-3rem)] max-w-full object-contain shadow-2xl"
        />
        <form method="dialog" className="absolute right-4 top-4 z-20">
          <button
            type="submit"
            aria-label="Fechar"
            className="rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25"
          >
            <Close size={20} aria-hidden />
          </button>
        </form>
      </dialog>
    </>
  );
}
