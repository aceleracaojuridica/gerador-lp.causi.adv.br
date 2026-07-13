"use client";

import {
  Check,
  ChevronRight,
  KeyboardArrowDown,
} from "@material-symbols-svg/react";
import { createContext, type ReactNode, useContext, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Tone } from "@/lib/landing-pages/schema";
import { cn } from "@/lib/utils";

export const AccordionListContext = createContext(false);

/**
 * Cabeçalho de agrupamento de campos sem colapsar — mostra tudo direto,
 * só separa visualmente com um título e uma linha divisória no topo.
 */
export function FieldGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

export function EditorSectionAccordion({
  title,
  defaultOpen,
  target,
  onOpen,
  children,
  domId,
  open: openProp,
  onOpenChange,
  toggle: sectionToggle,
  icon,
  subtitle,
  flush,
  bare,
}: {
  title: string;
  defaultOpen?: boolean;
  target?: string;
  onOpen?: (target: string) => void;
  children?: React.ReactNode;
  domId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  toggle?: { on: boolean; onChange: (on: boolean) => void };
  icon?: React.ReactNode;
  subtitle?: string;
  flush?: boolean;
  bare?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(!!defaultOpen);
  const listed = useContext(AccordionListContext);
  const asFlush = flush || listed;

  if (bare) {
    return <div className="flex flex-col gap-3">{children}</div>;
  }

  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const off = sectionToggle ? !sectionToggle.on : false;

  function toggle() {
    const opening = !open;
    if (!controlled) setInternalOpen(opening);
    onOpenChange?.(opening);
    if (opening && target) onOpen?.(target);
  }

  return (
    <div
      id={domId}
      className={cn(
        "scroll-mt-3",
        !asFlush && "rounded-xl border border-border",
      )}
    >
      <div
        className={cn(
          "group relative flex items-center gap-3 px-4 py-3 transition",
          open ? "bg-card" : "bg-card hover:bg-muted/50",
          asFlush ? "" : open ? "rounded-t-xl" : "rounded-xl",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Recolher seção" : "Expandir seção"}
          className="absolute inset-0 h-auto rounded-[inherit] hover:bg-transparent"
        />
        {icon ? (
          <span
            className={cn(
              "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-lg",
              off
                ? "bg-muted text-muted-foreground/50"
                : open
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {icon}
          </span>
        ) : null}
        <div className="relative z-10 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-sm font-semibold",
                off
                  ? "text-muted-foreground"
                  : open
                    ? "text-primary"
                    : "text-foreground",
              )}
            >
              {title}
            </span>
            {sectionToggle ? (
              <Badge
                variant="secondary"
                className={cn(
                  "pointer-events-auto shrink-0 cursor-pointer text-[0.7rem]",
                  sectionToggle.on
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-muted text-muted-foreground",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  sectionToggle.onChange(!sectionToggle.on);
                }}
              >
                {sectionToggle.on ? "Ativo" : "Oculta"}
              </Badge>
            ) : null}
          </div>
          {subtitle ? (
            <p
              className={cn(
                "truncate text-xs",
                off ? "text-muted-foreground/50" : "text-muted-foreground",
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <KeyboardArrowDown
          size={18}
          className={cn(
            "pointer-events-none relative z-10 shrink-0 transition-transform",
            open ? "rotate-180 text-primary" : "text-muted-foreground",
          )}
        />
      </div>
      {open ? (
        <div className="flex flex-col gap-3 border-t border-border px-4 py-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/** @deprecated alias */
export const Accordion = EditorSectionAccordion;

/** Linha do menu principal — abre o painel de detalhe (não expande inline). */
export function EditorSectionMenuRow({
  title,
  subtitle: _subtitle,
  meta,
  icon,
  toggle: sectionToggle,
  active = false,
  onPress,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: React.ReactNode;
  toggle?: { on: boolean; onChange: (on: boolean) => void };
  active?: boolean;
  onPress: () => void;
}) {
  const off = sectionToggle ? !sectionToggle.on : false;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 transition",
        active
          ? "bg-primary/8 shadow-[inset_3px_0_0_0_hsl(var(--primary))]"
          : "bg-transparent hover:bg-muted/40",
      )}
    >
      <button
        type="button"
        onClick={onPress}
        aria-label={`Editar ${title}`}
        className="absolute inset-0 rounded-[inherit]"
      />
      {icon ? (
        <span
          className={cn(
            "pointer-events-none relative z-10 flex size-7 shrink-0 items-center justify-center rounded-md",
            off
              ? "bg-muted text-muted-foreground/50"
              : active
                ? "bg-primary/12 text-primary"
                : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="pointer-events-none relative z-10 min-w-0 flex-1">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={cn(
              "truncate text-sm font-semibold",
              off
                ? "text-muted-foreground"
                : active
                  ? "text-primary"
                  : "text-foreground",
            )}
          >
            {title}
          </span>
          {meta ? (
            <Badge
              variant="outline"
              className={cn(
                "hidden h-4 shrink-0 rounded-full px-1 text-[0.6rem] font-medium sm:inline-flex",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
            >
              {meta}
            </Badge>
          ) : null}
          {sectionToggle ? (
            <Badge
              variant="secondary"
              className={cn(
                "pointer-events-auto h-4 shrink-0 cursor-pointer rounded-full px-1.5 text-[0.6rem]",
                sectionToggle.on
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-muted text-muted-foreground",
              )}
              onClick={(e) => {
                e.stopPropagation();
                sectionToggle.onChange(!sectionToggle.on);
              }}
            >
              {sectionToggle.on ? "Ativo" : "Oculta"}
            </Badge>
          ) : null}
        </div>
      </div>
      <ChevronRight
        size={15}
        className={cn(
          "pointer-events-none relative z-10 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
    </div>
  );
}

export function ToneToggle({
  value,
  onChange,
}: {
  value: Tone;
  onChange: (t: Tone) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm font-medium text-foreground">
        Fundo da seção
      </span>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as Tone)}
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
      >
        <ToggleGroupItem value="light" className="flex-1 px-2.5 sm:flex-none">
          Claro
        </ToggleGroupItem>
        <ToggleGroupItem value="dark" className="flex-1 px-2.5 sm:flex-none">
          Escuro
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}

export const CORNER_OPTIONS = [
  { id: "rounded", label: "Arredondado" },
  { id: "square", label: "Quadrado" },
] as const;

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { id: T; label: string }[];
  label?: string;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
      ) : null}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as T)}
        variant="outline"
        className="flex w-full gap-1 rounded-xl p-1"
      >
        {options.map((opt) => (
          <ToggleGroupItem
            key={opt.id}
            value={opt.id}
            className="flex flex-1 items-center justify-center gap-1.5 py-2 text-sm"
          >
            {value === opt.id ? <Check size={15} /> : null}
            {opt.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
