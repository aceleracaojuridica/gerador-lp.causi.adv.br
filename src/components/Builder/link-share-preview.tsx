import type { ReactNode } from "react";

export type LinkSharePreviewProps = {
  title: string;
  description: string;
  image?: string;
  siteName?: string;
  host?: string;
  /** Rótulo superior (ex.: "Prévia no Facebook / Instagram"). */
  label?: string;
  badge?: ReactNode;
  footer?: ReactNode;
  className?: string;
  imagePlaceholder?: string;
};

/**
 * Prévia estilo Open Graph — como o link aparece ao compartilhar no Meta/WhatsApp.
 */
export function LinkSharePreview({
  title,
  description,
  image,
  siteName,
  host,
  label,
  badge,
  footer,
  className = "",
  imagePlaceholder = "Sem imagem de preview",
}: LinkSharePreviewProps) {
  return (
    <div
      className={`overflow-hidden bg-white ${label || footer ? "rounded-lg border border-slate-200" : ""} ${className}`}
    >
      {label ? (
        <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}

      <div className="relative">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="aspect-[1.91/1] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[1.91/1] items-center justify-center bg-slate-100 text-xs text-slate-400">
            {imagePlaceholder}
          </div>
        )}
        {badge ? <div className="absolute top-2 right-2">{badge}</div> : null}
      </div>

      <div className="space-y-0.5 border-t border-slate-100 bg-slate-50 px-3 py-2.5">
        {siteName ? (
          <p className="truncate text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
            {siteName}
          </p>
        ) : null}
        {host ? (
          <p className="truncate font-mono text-[0.65rem] font-medium text-ui">
            {host}
          </p>
        ) : null}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
          {title || "Título da página"}
        </p>
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
          {description || "Descrição que aparece ao compartilhar o link."}
        </p>
      </div>

      {footer ? (
        <div className="border-t border-slate-100 bg-white px-3 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
