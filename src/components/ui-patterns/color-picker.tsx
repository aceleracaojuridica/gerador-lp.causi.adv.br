import { Check } from "@material-symbols-svg/react/rounded/w600";
import { useState } from "react";
import { STAGE_COLORS } from "@/lib/constants/colors";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { ColorDot } from "../ui-fragments/color-dot";

/**
 * Propriedades para o componente ColorPicker.
 */
interface ColorPickerProps {
  /** A cor atualmente selecionada (formato hexadecimal). */
  value: string;
  /** Função de callback chamada quando uma nova cor é selecionada. */
  onChange: (color: string) => void;
}

/**
 * Componente seletor de cores simplificado.
 * Apresenta um grid de cores pré-definidas em um Popover.
 *
 * @param {ColorPickerProps} props - Propriedades do seletor de cores.
 * @returns {JSX.Element} O seletor de cores.
 *
 * TODO: https://www.cult-ui.com/docs/components/color-picker
 */
export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon-xs" className="w-5">
          <ColorDot color={value} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Cor da etapa</span>
          <div className="grid grid-cols-5 gap-2">
            {STAGE_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  onChange(color.value);
                  setOpen(false);
                }}
                className={cn(
                  "size-5 rounded border-background transition-opacity hover:opacity-80",
                )}
                style={{ backgroundColor: color.value, color: color.value }}
              >
                {value === color.value && (
                  <Check className="size-4 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
