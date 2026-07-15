"use client";

import { Add, Close } from "@material-symbols-svg/react";
import { SocialIcon } from "@/components/icons/social-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Social } from "@/lib/landing-pages/schema";
import { detectNetwork } from "@/lib/landing-pages/socials";

/**
 * Edição das redes sociais como LISTA: cada linha é só o link (com um ícone
 * read-only que reflete a rede detectada pela URL), com remover, e um "+" para
 * adicionar. A rede é inferida automaticamente do link.
 */
export function SocialsInput({
  socials,
  onChange,
  onAdd,
  onRemove,
  hideAddButton = false,
  hideRemove = false,
  disabledIndexes = [],
}: {
  socials: Social[];
  onChange: (i: number, url: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  /** Oculta o botão interno "+ Adicionar" (quando o pai renderiza o próprio). */
  hideAddButton?: boolean;
  /** Oculta o "X" de remover cada linha. */
  hideRemove?: boolean;
  /** Índices bloqueados para edição/remoção. */
  disabledIndexes?: number[];
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {socials.map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: social rows have no stable id
          <div key={i} className="flex items-center gap-1.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground">
              <SocialIcon network={detectNetwork(s.url)} size={16} />
            </span>
            <Input
              aria-label={`Link da rede ${i + 1}`}
              value={s.url}
              onChange={(e) => onChange(i, e.target.value)}
              placeholder="Cole o link (Instagram, TikTok, YouTube...)"
              inputMode="url"
              className="flex-1"
              disabled={disabledIndexes.includes(i)}
            />
            {hideRemove || disabledIndexes.includes(i) ? null : (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remover rede"
                onClick={() => onRemove(i)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Close size={16} />
              </Button>
            )}
          </div>
        ))}
      </div>

      {hideAddButton ? null : (
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="w-full"
        >
          <Add size={16} /> Adicionar rede social
        </Button>
      )}
    </div>
  );
}
