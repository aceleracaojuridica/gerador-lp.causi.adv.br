import { AuthPageShell } from "@/components/auth/auth-page-shell";

/** Layout do grupo de rotas públicas de autenticação. */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
