import CausiLogoIcon from "@/components/icons/causi-logo";
import { cn } from "@/lib/utils";

interface PageLoadingProps {
  className?: string;
}

/** Fallback padrão de carregamento de rotas: logo Causi + texto. */
export function PageLoading({ className }: PageLoadingProps) {
  return (
    <div
      className={cn(
        "flex h-dvh flex-col items-center justify-center gap-2",
        className,
      )}
    >
      <CausiLogoIcon className="size-24 animate-pulse [animation-duration:1s]" />
      <p className="text-sm text-muted-foreground-light">Carregando...</p>
    </div>
  );
}
