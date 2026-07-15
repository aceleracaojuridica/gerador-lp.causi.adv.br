import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeWrapper } from "@/components/theme-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Provider } from "@/provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Causi | Marketing",
  description: "O Motor de Honorários da Advocacia Moderna",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        "font-sans",
        inter.className,
        inter.variable,
      )}
    >
      <head />
      <body>
        <ThemeWrapper>
          <Provider>{children}</Provider>
          <Toaster position="top-right" duration={5000} />
        </ThemeWrapper>
      </body>
    </html>
  );
}
