"use client";

import { Add, Close } from "@material-symbols-svg/react";
import { SocialIcon } from "@/components/icons/social-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Social, SocialNetwork } from "@/lib/landing-pages/schema";
import { SOCIALS_META } from "@/lib/landing-pages/socials";

/**
 * Edição das redes sociais como LISTA (igual aos diferenciais): cada linha tem
 * um dropdown de ÍCONE (fechado mostra só o ícone; aberto mostra ícone + nome)
 * + o link, com remover, e um "+" para adicionar. Permite repetir a rede.
 */
export function SocialsInput({
  socials,
  onChange,
  onAdd,
  onRemove,
}: {
  socials: Social[];
  onChange: (i: number, key: "network" | "url", value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  const placeholderOf = (n: SocialNetwork) =>
    SOCIALS_META.find((m) => m.id === n)?.placeholder ?? "";

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        {socials.map((s, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: social rows have no stable id
          <div key={i} className="flex items-center gap-1.5">
            <NetworkSelect
              value={s.network}
              onChange={(n) => onChange(i, "network", n)}
            />
            <Input
              aria-label={`Link da rede ${i + 1}`}
              value={s.url}
              onChange={(e) => onChange(i, "url", e.target.value)}
              placeholder={placeholderOf(s.network)}
              inputMode="url"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remover rede"
              onClick={() => onRemove(i)}
              className="shrink-0 text-slate-400 hover:text-slate-700"
            >
              <Close size={16} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={onAdd}
        className="w-full"
      >
        <Add size={16} /> Adicionar rede social
      </Button>
    </div>
  );
}

// Trigger compacto: apenas o ícone da rede selecionada + chevron automático do SelectTrigger.
function NetworkSelect({
  value,
  onChange,
}: {
  value: SocialNetwork;
  onChange: (n: SocialNetwork) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SocialNetwork)}>
      <SelectTrigger
        aria-label="Escolher rede"
        className="h-9 w-auto shrink-0 gap-1 px-2"
      >
        <SocialIcon network={value} size={16} />
      </SelectTrigger>
      <SelectContent>
        {SOCIALS_META.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            <span className="flex items-center gap-2.5">
              <SocialIcon network={m.id} size={16} />
              {m.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
