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
  );
}
