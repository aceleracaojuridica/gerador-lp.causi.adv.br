import type { Metadata } from "next";
import { AuthPageShell } from "@/components/auth/auth-page-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Layout do grupo de rotas públicas de autenticação. */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AuthPageShell>{children}</AuthPageShell>;
}
