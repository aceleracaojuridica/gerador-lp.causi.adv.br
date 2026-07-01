"use client";

import { Help, Info, Moving } from "@material-symbols-svg/react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AvatarDropdown from "./ui-patterns/avatar-dropdown";

/** Props for the SidebarBottom component */
interface SidebarBottomProps {
  /** Currently active path for highlighting the active nav item */
  currentPath: string;
  /** Callback to close the sidebar (useful for mobile) */
  onClose?: () => void;
  /** Callback to open the support modal */
  onOpenSupport?: () => void;
  /** Optional mode to further customize the bottom section */
  isClassroom?: boolean;
}

/** Seção inferior do sidebar com itens fixos e dinâmicos. */
export function SidebarBottom({
  currentPath,
  onOpenSupport,
}: SidebarBottomProps) {
  // ITENS HARDCODED conforme solicitado
  // Mesmo que em modo classroom, os itens de rodapé podem ser os mesmos ou simplificados.
  // A instrução diz "deixe o mai harded-code possivel".

  return (
    <div className="mt-auto flex flex-col gap-1 items-center border-t border-border/50 pt-4">
      {/* Suporte */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            className={`${currentPath === "#" ? "text-primary bg-primary/5" : ""}`}
            onClick={onOpenSupport}
          >
            <Help className="size-5.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Suporte</p>
        </TooltipContent>
      </Tooltip>

      {/* Limite de uso - Popover Hardcoded */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                className="rounded-full size-11 flex items-center justify-center border-3 border-t-primary border-x-muted border-b-muted"
              >
                <span className="text-[11px] text-muted-foreground/80">7%</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4" align="center" side="right">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-sm text-foreground">
                      Oportunidades
                    </span>
                    <Info className="size-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    136 de 5.000
                  </span>
                </div>

                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7c3aed] rounded-full transition-all duration-300"
                    style={{ width: `${5}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Você já utilizou 2% do seu limite de 5.000
                </p>

                <Button
                  variant="outline"
                  size="xs"
                  className="w-full text-[#7c3aed] border-[#7c3aed]/30 hover:bg-[#7c3aed]/5"
                >
                  <Moving className="size-4 mr-1.5" />
                  Aumentar Limites
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Limite de uso</p>
        </TooltipContent>
      </Tooltip>

      <AvatarDropdown />
    </div>
  );
}
