import type { TrackingProviderConfig } from "@/lib/landing-pages/schema";

/** Formato legado (flat) antes dos toggles por provedor. */
type LegacyTrackingFlat = {
  ga4MeasurementId?: string;
  gtmContainerId?: string;
  metaPixelId?: string;
  googleAdsId?: string;
  googleAdsLabel?: string;
};

type RawTracking = Partial<TrackingProviderConfig & LegacyTrackingFlat>;

function providerEnabled(id: string, enabled?: boolean): boolean {
  const trimmed = id.trim();
  if (enabled !== undefined) return enabled;
  return trimmed.length > 0;
}

/** Normaliza tracking legado (flat) ou parcial para o shape com toggles. */
export function normalizeTracking(
  raw?: RawTracking | null,
): TrackingProviderConfig {
  if (!raw) {
    return {
      ga4: { enabled: false, measurementId: "" },
      gtm: { enabled: false, containerId: "" },
      metaPixel: { enabled: false, pixelId: "" },
      googleAds: { enabled: false, adsId: "", conversionLabel: "" },
    };
  }

  if ("ga4" in raw && raw.ga4 && typeof raw.ga4 === "object") {
    const ga4Id = raw.ga4.measurementId?.trim() ?? "";
    const gtmId = raw.gtm?.containerId?.trim() ?? "";
    const metaId = raw.metaPixel?.pixelId?.trim() ?? "";
    const adsId = raw.googleAds?.adsId?.trim() ?? "";

    return {
      ga4: {
        enabled: providerEnabled(ga4Id, raw.ga4.enabled),
        measurementId: ga4Id,
      },
      gtm: {
        enabled: providerEnabled(gtmId, raw.gtm?.enabled),
        containerId: gtmId,
      },
      metaPixel: {
        enabled: providerEnabled(metaId, raw.metaPixel?.enabled),
        pixelId: metaId,
      },
      googleAds: {
        enabled: providerEnabled(adsId, raw.googleAds?.enabled),
        adsId,
        conversionLabel: raw.googleAds?.conversionLabel?.trim() ?? "",
      },
    };
  }

  const ga4Id = raw.ga4MeasurementId?.trim() ?? "";
  const gtmId = raw.gtmContainerId?.trim() ?? "";
  const metaId = raw.metaPixelId?.trim() ?? "";
  const adsId = raw.googleAdsId?.trim() ?? "";
  const adsLabel = raw.googleAdsLabel?.trim() ?? "";

  return {
    ga4: { enabled: providerEnabled(ga4Id), measurementId: ga4Id },
    gtm: { enabled: providerEnabled(gtmId), containerId: gtmId },
    metaPixel: { enabled: providerEnabled(metaId), pixelId: metaId },
    googleAds: {
      enabled: providerEnabled(adsId),
      adsId,
      conversionLabel: adsLabel,
    },
  };
}
