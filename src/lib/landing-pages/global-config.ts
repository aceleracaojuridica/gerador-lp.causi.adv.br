import type {
  ConversionTags,
  Office,
  SocialNetwork,
  TrackingProviderConfig,
} from "@/lib/landing-pages/schema";
import { normalizeTracking } from "@/lib/landing-pages/tracking";

export type GlobalConfig = {
  fonts: { heading: string; body: string };
  tags: ConversionTags;
  tracking: TrackingProviderConfig;
  address?: {
    address: string;
    cidade: string;
    uf: string;
    mapsUrl: string;
  };
  contact?: {
    whatsapp: string;
    whatsappDisplay: string;
    email: string;
  };
  socials?: { network: SocialNetwork; url: string }[];
};

export const DEFAULT_TRACKING: TrackingProviderConfig = normalizeTracking();

export const DEFAULT_CONFIG: GlobalConfig = {
  fonts: { heading: "", body: "" },
  tags: { head: "", body: "", footer: "" },
  tracking: DEFAULT_TRACKING,
};

function pickString(
  value: string | undefined,
  fallback: string,
  overwrite: boolean,
): string {
  if (overwrite) return fallback;

  return value?.trim() ? value : fallback;
}

/**
 * Merge de um provedor: ID vazio na LP herda id + enabled da conta;
 * ID preenchido usa os valores da LP (override explícito).
 */
function mergeProvider<T extends { enabled: boolean }>(
  current: T | undefined,
  incoming: T,
  overwrite: boolean,
  idKey: keyof T,
): T {
  if (overwrite) {
    return { ...incoming };
  }

  const currentId = String(current?.[idKey] ?? "").trim();
  if (!currentId) {
    return {
      ...incoming,
      ...current,
      enabled: incoming.enabled,
      [idKey]: incoming[idKey],
    } as T;
  }

  return {
    ...incoming,
    ...current,
    enabled: current?.enabled ?? incoming.enabled,
    [idKey]: currentId,
  } as T;
}

function mergeTracking(
  current: TrackingProviderConfig | undefined,
  incoming: TrackingProviderConfig,
  overwrite: boolean,
): TrackingProviderConfig {
  const base = normalizeTracking(current);
  const defaults = normalizeTracking(incoming);

  const googleAdsIdEmpty = !base.googleAds.adsId.trim();

  return {
    ga4: mergeProvider(base.ga4, defaults.ga4, overwrite, "measurementId"),
    gtm: mergeProvider(base.gtm, defaults.gtm, overwrite, "containerId"),
    metaPixel: mergeProvider(
      base.metaPixel,
      defaults.metaPixel,
      overwrite,
      "pixelId",
    ),
    googleAds: overwrite
      ? defaults.googleAds
      : {
          adsId: pickString(
            base.googleAds.adsId,
            defaults.googleAds.adsId,
            false,
          ),
          enabled: googleAdsIdEmpty
            ? defaults.googleAds.enabled
            : base.googleAds.enabled,
          conversionLabel: pickString(
            base.googleAds.conversionLabel,
            defaults.googleAds.conversionLabel,
            false,
          ),
        },
  };
}

function mergeTags(
  current: ConversionTags | undefined,
  incoming: ConversionTags,
  overwrite: boolean,
): ConversionTags {
  return {
    head: pickString(current?.head, incoming.head, overwrite),
    body: pickString(current?.body, incoming.body, overwrite),
    footer: pickString(current?.footer, incoming.footer, overwrite),
  };
}

export function normalizeGlobalConfig(
  value?: Partial<GlobalConfig> | null,
): GlobalConfig {
  return {
    fonts: {
      heading: value?.fonts?.heading ?? "",
      body: value?.fonts?.body ?? "",
    },
    tags: {
      head: value?.tags?.head ?? "",
      body: value?.tags?.body ?? "",
      footer: value?.tags?.footer ?? "",
    },
    tracking: normalizeTracking(value?.tracking),
    address: value?.address
      ? {
          address: value.address.address ?? "",
          cidade: value.address.cidade ?? "",
          uf: value.address.uf ?? "",
          mapsUrl: value.address.mapsUrl ?? "",
        }
      : undefined,
    contact: value?.contact
      ? {
          whatsapp: value.contact.whatsapp ?? "",
          whatsappDisplay: value.contact.whatsappDisplay ?? "",
          email: value.contact.email ?? "",
        }
      : undefined,
    socials: value?.socials
      ? value.socials.map((s) => ({
          network: s.network ?? "",
          url: s.url ?? "",
        }))
      : undefined,
  };
}

export function applyGlobalConfigToOffice(
  office: Office,
  config: GlobalConfig,
  options?: { overwrite?: boolean; marketingOnly?: boolean },
): Office {
  const overwrite = options?.overwrite ?? false;
  const marketingOnly = options?.marketingOnly ?? false;
  const normalized = normalizeGlobalConfig(config);

  return {
    ...office,
    fonts: marketingOnly
      ? office.fonts
      : {
          heading: pickString(
            office.fonts?.heading,
            normalized.fonts.heading,
            overwrite,
          ),
          body: pickString(
            office.fonts?.body,
            normalized.fonts.body,
            overwrite,
          ),
        },
    tags: mergeTags(office.tags, normalized.tags, overwrite),
    tracking: mergeTracking(
      normalizeTracking(office.tracking),
      normalized.tracking,
      overwrite,
    ),
  };
}

export function extractGlobalConfigFromOffice(office: Office): GlobalConfig {
  return normalizeGlobalConfig({
    fonts: office.fonts,
    tags: office.tags,
    tracking: office.tracking,
  });
}
