import type {
  CaptchaConfig,
  ConversionTags,
  Office,
  TrackingProviderConfig,
} from "@/lib/landing-pages/schema";

export type GlobalConfig = {
  fonts: { heading: string; body: string };
  tags: ConversionTags;
  tracking: TrackingProviderConfig;
  captcha: CaptchaConfig;
  domain: string;
};

export const DEFAULT_TRACKING: TrackingProviderConfig = {
  ga4MeasurementId: "",
  gtmContainerId: "",
  metaPixelId: "",
  googleAdsId: "",
  googleAdsLabel: "",
};

export const DEFAULT_CAPTCHA: CaptchaConfig = {
  provider: "none",
  siteKey: "",
  widgetTheme: "auto",
};

export const DEFAULT_CONFIG: GlobalConfig = {
  fonts: { heading: "", body: "" },
  tags: { head: "", body: "", footer: "" },
  tracking: DEFAULT_TRACKING,
  captcha: DEFAULT_CAPTCHA,
  domain: "",
};

function pickString(
  value: string | undefined,
  fallback: string,
  overwrite: boolean,
): string {
  if (overwrite) return fallback;

  return value?.trim() ? value : fallback;
}

function mergeTracking(
  current: TrackingProviderConfig | undefined,
  incoming: TrackingProviderConfig,
  overwrite: boolean,
): TrackingProviderConfig {
  return {
    ga4MeasurementId: pickString(
      current?.ga4MeasurementId,
      incoming.ga4MeasurementId,
      overwrite,
    ),
    gtmContainerId: pickString(
      current?.gtmContainerId,
      incoming.gtmContainerId,
      overwrite,
    ),
    metaPixelId: pickString(
      current?.metaPixelId,
      incoming.metaPixelId,
      overwrite,
    ),
    googleAdsId: pickString(
      current?.googleAdsId,
      incoming.googleAdsId,
      overwrite,
    ),
    googleAdsLabel: pickString(
      current?.googleAdsLabel,
      incoming.googleAdsLabel,
      overwrite,
    ),
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

function mergeCaptcha(
  current: CaptchaConfig | undefined,
  incoming: CaptchaConfig,
  overwrite: boolean,
): CaptchaConfig {
  if (overwrite) {
    return {
      provider: incoming.provider,
      siteKey: incoming.siteKey,
      widgetTheme: incoming.widgetTheme,
    };
  }

  return {
    provider:
      current?.provider && current.provider !== "none"
        ? current.provider
        : incoming.provider,
    siteKey: current?.siteKey?.trim() ? current.siteKey : incoming.siteKey,
    widgetTheme:
      current?.widgetTheme && current.widgetTheme !== "auto"
        ? current.widgetTheme
        : incoming.widgetTheme,
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
    tracking: {
      ga4MeasurementId: value?.tracking?.ga4MeasurementId ?? "",
      gtmContainerId: value?.tracking?.gtmContainerId ?? "",
      metaPixelId: value?.tracking?.metaPixelId ?? "",
      googleAdsId: value?.tracking?.googleAdsId ?? "",
      googleAdsLabel: value?.tracking?.googleAdsLabel ?? "",
    },
    captcha: {
      provider: value?.captcha?.provider ?? "none",
      siteKey: value?.captcha?.siteKey ?? "",
      widgetTheme: value?.captcha?.widgetTheme ?? "auto",
    },
    domain: value?.domain ?? "",
  };
}

export function applyGlobalConfigToOffice(
  office: Office,
  config: GlobalConfig,
  options?: { overwrite?: boolean },
): Office {
  const overwrite = options?.overwrite ?? false;

  return {
    ...office,
    fonts: {
      heading: pickString(
        office.fonts?.heading,
        config.fonts.heading,
        overwrite,
      ),
      body: pickString(office.fonts?.body, config.fonts.body, overwrite),
    },
    tags: mergeTags(office.tags, config.tags, overwrite),
    tracking: mergeTracking(office.tracking, config.tracking, overwrite),
    captcha: mergeCaptcha(office.captcha, config.captcha, overwrite),
    domain: pickString(office.domain, config.domain, overwrite),
  };
}

export function extractGlobalConfigFromOffice(office: Office): GlobalConfig {
  return normalizeGlobalConfig({
    fonts: office.fonts,
    tags: office.tags,
    tracking: office.tracking,
    captcha: office.captcha,
    domain: office.domain,
  });
}
