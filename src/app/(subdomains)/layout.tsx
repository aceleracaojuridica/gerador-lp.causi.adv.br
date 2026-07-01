export default function PublicLpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-white">{children}</div>;
}
