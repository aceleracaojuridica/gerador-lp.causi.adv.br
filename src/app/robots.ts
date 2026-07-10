import type { MetadataRoute } from "next";
import { headers } from "next/headers";

/** Bloqueia crawlers no domínio do app; subdomínios de LP controlam indexação por página. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  const appDomain = (
    process.env.NEXT_PUBLIC_APP_DOMAIN ?? "causi.adv.br"
  ).replace(/^https?:\/\//, "");

  const isLpSubdomain =
    host !== appDomain &&
    host !== "localhost" &&
    (host.endsWith(`.${appDomain}`) || host.endsWith(".localhost"));

  if (isLpSubdomain) {
    return {
      rules: { userAgent: "*", allow: "/" },
    };
  }

  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
