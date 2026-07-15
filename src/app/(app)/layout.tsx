import type { Metadata } from "next";
import {
  Cinzel,
  Cormorant_Garamond,
  DM_Serif_Display,
  Fraunces,
  Montserrat,
  Playfair_Display,
  Poppins,
  Raleway,
  Roboto,
} from "next/font/google";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/app-layout";
import { LpAccessProvider } from "@/components/lp-access-provider";
import { SessionProvider } from "@/components/session-provider";
import { dealsPath } from "@/lib/deals-path";
import { getPipelineCookie } from "@/lib/pipeline-cookie";
import {
  getSession,
  hasLpAccess,
  shouldClearStaleAccountCookie,
} from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
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

const editorFontVars = [
  fraunces.variable,
  dmSerifDisplay.variable,
  montserrat.variable,
  cinzel.variable,
  poppins.variable,
  playfair.variable,
  cormorant.variable,
  roboto.variable,
  raleway.variable,
].join(" ");

export default async function AppRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, clearStaleAccountCookie, pipelineCookieId] =
    await Promise.all([
      getSession(),
      shouldClearStaleAccountCookie(),
      getPipelineCookie(),
    ]);

  if (!session) {
    redirect("/login?next=/");
  }

  return (
    <div className={cn(editorFontVars)}>
      <SessionProvider
        session={session}
        clearStaleAccountCookie={clearStaleAccountCookie}
      >
        <LpAccessProvider hasLpAccess={hasLpAccess(session)}>
          <AppLayout dealsHref={dealsPath(pipelineCookieId)}>
            {children}
          </AppLayout>
        </LpAccessProvider>
      </SessionProvider>
    </div>
  );
}
