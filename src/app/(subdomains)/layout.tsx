import { Fraunces } from "next/font/google";
import { preconnect } from "react-dom";
import { cn } from "@/lib/utils";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export default function PublicLpLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  preconnect("https://challenges.cloudflare.com");

  return (
    <div className={cn("min-h-screen bg-white", fraunces.variable)}>
      {children}
    </div>
  );
}
