export default function AppTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden animate-in fade-in-0 slide-in-from-bottom-2 duration-200 fill-mode-both">
      {children}
    </div>
  );
}
