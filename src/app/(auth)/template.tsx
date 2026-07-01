export default function AuthTemplate({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200 fill-mode-both">
      {children}
    </div>
  );
}
