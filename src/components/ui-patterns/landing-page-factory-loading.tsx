import CausiLogoIcon from "@/components/icons/causi-logo";
import { cn } from "@/lib/utils";

import "./landing-page-factory-loading.css";

interface LandingPageFactoryLoadingProps {
  className?: string;
}

const FACTORY_UNIT_KEYS = ["unit-a", "unit-b", "unit-c"] as const;

function FactoryLandingUnit({
  delayClass,
}: {
  delayClass?: "lp-factory-unit--delay-1" | "lp-factory-unit--delay-2";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "lp-factory-unit absolute top-1/2 left-0 w-[88px] -translate-y-[calc(50%+6px)] rounded-md border border-border bg-card p-1.5 shadow-sm",
        delayClass,
      )}
    >
      <div className="lp-factory-section lp-factory-section--hero mb-1 h-3 rounded-sm bg-primary/25" />
      <div className="lp-factory-section lp-factory-section--body mb-1 space-y-0.5">
        <div className="h-1 w-full rounded-full bg-muted" />
        <div className="h-1 w-[80%] rounded-full bg-muted" />
      </div>
      <div className="lp-factory-section lp-factory-section--cta h-2 w-2/3 rounded-sm bg-primary/40" />
    </div>
  );
}

/** Fallback de rotas de criação/edição de LP — esteira montando landing pages. */
export function LandingPageFactoryLoading({
  className,
}: LandingPageFactoryLoadingProps) {
  return (
    <div
      className={cn(
        "flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-muted/20",
        className,
      )}
    >
      <div
        aria-hidden
        className="relative w-full max-w-md px-6"
        role="presentation"
      >
        <div className="relative h-28 overflow-hidden rounded-xl border border-border/60 bg-background/80">
          <div className="absolute inset-x-0 bottom-3 h-2 rounded-full bg-muted/80" />
          <div className="lp-factory-belt absolute inset-x-4 bottom-2.5 h-1 rounded-full opacity-80" />

          {FACTORY_UNIT_KEYS.map((key, index) => (
            <FactoryLandingUnit
              key={key}
              delayClass={
                index === 1
                  ? "lp-factory-unit--delay-1"
                  : index === 2
                    ? "lp-factory-unit--delay-2"
                    : undefined
              }
            />
          ))}

          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-linear-to-r from-background/90 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background/90 to-transparent" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-2">
        <CausiLogoIcon className="size-12 animate-pulse [animation-duration:1s]" />
        <p className="text-sm text-muted-foreground-light">
          Montando sua landing page...
        </p>
      </div>
    </div>
  );
}
