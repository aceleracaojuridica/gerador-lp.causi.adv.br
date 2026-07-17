"use client";

import { useRef } from "react";

export const clampPct = (n: number) => Math.max(0, Math.min(100, n));

/**
 * A própria imagem vira a superfície de arrasto do enquadramento: arrastar
 * move o `background-position` (ponto focal em % x/y). Usado pelas fotos dos
 * advogados e pelas imagens de cenário das seções.
 */
export function FocalDragSurface({
  src,
  value,
  onChange,
  className,
}: {
  src: string;
  value: { x: number; y: number };
  onChange: (v: { x: number; y: number }) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    fx: number;
    fy: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, fx: value.x, fy: value.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = ref.current;
    if (!d || !box) return;
    const r = box.getBoundingClientRect();
    const nx = clampPct(d.fx - ((e.clientX - d.sx) / r.width) * 100);
    const ny = clampPct(d.fy - ((e.clientY - d.sy) / r.height) * 100);
    onChange({ x: Math.round(nx), y: Math.round(ny) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`cursor-move touch-none select-none overflow-hidden bg-lp-brand ${className ?? ""}`}
      style={{
        backgroundImage: `url('${src}')`,
        backgroundSize: "cover",
        backgroundPosition: `${value.x}% ${value.y}%`,
      }}
    />
  );
}
