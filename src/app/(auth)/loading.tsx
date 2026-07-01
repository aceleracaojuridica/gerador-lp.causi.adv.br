import CausiLogo from "@/components/icons/causi-logo";

export default function DashboardLoading() {
  return (
    <div className="flex h-dvh items-center justify-center">
      <div className="flex flex-col gap-2 justify-center items-center animate-pulse">
        <CausiLogo className="size-20 text-primary" />
        <div className="flex gap-1 justify-center items-center">
          <p className="text-xl text-muted-foreground">Carregando</p>
        </div>
      </div>
    </div>
  );
}
