import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";
import { cn } from "@/lib/utils";

const spinnerVariants = cva("animate-spin", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      primary: "text-primary",
      none: "text-inherit",
    },
    size: {
      xs: "size-3",
      sm: "size-4",
      md: "size-6",
      lg: "size-8",
      xl: "size-10",
      "2xl": "size-12",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
});

interface SpinnerProps
  extends Omit<React.ComponentProps<"svg">, "color">,
    VariantProps<typeof spinnerVariants> {}

function Spinner({ className, variant, size, ...props }: SpinnerProps) {
  const id = useId();
  const maskId = `spinner-mask-${id}`;
  const gradientId = `spinner-grad-${id}`;

  const strokeWidth = 3;
  const r = (32 - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <output className="inline-flex" aria-label="Carregando">
      <svg
        role="img"
        aria-label="Spinner"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(spinnerVariants({ variant, size }), className)}
        {...props}
      >
        <defs>
          {/*
           * Máscara: o arco (stroke branco) define a forma visível.
           * O gradiente cônico é aplicado num rect e recortado pela máscara —
           * assim o gradiente acompanha a geometria do arco perfeitamente,
           * independente da rotação do animate-spin.
           */}
          <mask id={maskId}>
            <circle
              cx="16"
              cy="16"
              r={r}
              stroke="white"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${circumference * 0.85} ${circumference * 0.15}`}
              transform="rotate(-90 16 16)"
            />
          </mask>

          {/*
           * Gradiente cônico simulado via linearGradient no espaço do SVG.
           * Como está fixo na máscara (que já tem o formato certo do arco),
           * a transição transparente→opaco cobre exatamente a cauda do arco.
           */}
          <linearGradient
            id={gradientId}
            gradientUnits="userSpaceOnUse"
            x1="16"
            y1="32"
            x2="16"
            y2="0"
          >
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Trilha de fundo */}
        <circle
          cx="16"
          cy="16"
          r={r}
          stroke="currentColor"
          strokeOpacity="0"
          strokeWidth={strokeWidth}
        />

        {/* Rect com gradiente, recortado pelo arco via mask */}
        <rect
          x="0"
          y="0"
          width="32"
          height="32"
          fill={`url(#${gradientId})`}
          mask={`url(#${maskId})`}
        />
      </svg>
    </output>
  );
}

export { Spinner, spinnerVariants };
