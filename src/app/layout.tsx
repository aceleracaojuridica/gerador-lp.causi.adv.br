import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fraunces,
  Inter,
  Montserrat,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
} from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeWrapper } from "@/components/theme-wrapper";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Provider } from "@/provider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-serif-display",
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700"],
});
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fontVars = [
  fraunces.variable,
  inter.variable,
  dmSerifDisplay.variable,
  montserrat.variable,
  cinzel.variable,
  poppins.variable,
  playfair.variable,
  cormorant.variable,
  roboto.variable,
  raleway.variable,
].join(" ");

export const metadata: Metadata = {
  title: "Causi",
  description: "O Motor de Honorários da Advocacia Moderna",
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
      className={cn("antialiased", "font-sans", inter.className, fontVars)}
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body>
        <ThemeWrapper>
          <Provider>{children}</Provider>
          <Toaster position="top-right" duration={5000} />
        </ThemeWrapper>
      </body>
    </html>
  );
}
