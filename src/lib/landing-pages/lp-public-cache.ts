import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import {
  type GlobalConfig,
  getAccountMarketingConfigByAccountId,
} from "@/lib/landing-pages/config";
import { DEFAULT_CONFIG } from "@/lib/landing-pages/global-config";

const PUBLIC_REVALIDATE_SECONDS = 120;

/** Tag de cache da LP pública (`office` + `slug` já normalizados). */
export function lpPublicCacheTag(office: string, slug: string): string {
  return `lp-public:${office}:${slug}`;
}

/** Tag de cache do padrão de marketing da conta. */
export function lpMarketingCacheTag(accountId: number): string {
  return `lp-marketing:${accountId}`;
}

/** Invalida o HTML/dados da LP pública (stale-while-revalidate). */
export function revalidateLpPublicCache(office: string, slug: string): void {
  const officeSafe = office.trim().toLowerCase();
  const slugSafe = slug.trim().toLowerCase();
  if (!officeSafe || !slugSafe) return;
  revalidateTag(lpPublicCacheTag(officeSafe, slugSafe), "max");
}

/** Invalida o padrão de marketing cacheado da conta. */
export function revalidateLpMarketingCache(accountId: number): void {
  if (!Number.isFinite(accountId) || accountId <= 0) return;
  revalidateTag(lpMarketingCacheTag(accountId), "max");
}

/** Marketing config com cache de ~2 min. */
export function getCachedAccountMarketingConfig(
  accountId: number,
): Promise<GlobalConfig> {
  if (!Number.isFinite(accountId) || accountId <= 0) {
    return Promise.resolve({ ...DEFAULT_CONFIG });
  }

  return unstable_cache(
    async () => getAccountMarketingConfigByAccountId(accountId),
    ["lp-marketing", String(accountId)],
    {
      revalidate: PUBLIC_REVALIDATE_SECONDS,
      tags: [lpMarketingCacheTag(accountId)],
    },
  )();
}

export { PUBLIC_REVALIDATE_SECONDS };
