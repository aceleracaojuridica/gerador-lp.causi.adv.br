"use client";

import {
  GoogleAds,
  GoogleAnalytics,
  GoogleTagManager,
  Meta,
} from "@thesvg/react";
import Link from "next/link";
import { AutoTextarea } from "@/components/auto-textarea";
import { IntegrationProviderCard } from "@/components/integrations/integration-provider-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { GlobalConfig } from "@/lib/landing-pages/global-config";
import type { SeoMeta } from "@/lib/landing-pages/schema";
import { normalizeTracking } from "@/lib/landing-pages/tracking";
import { BuilderField } from "../../shared/fields";
import { FieldGroup } from "../controls/editor-controls";

function accountProviderHint(
  account: GlobalConfig,
  provider: "ga4" | "gtm" | "metaPixel" | "googleAds",
): string {
  const tracking = normalizeTracking(account.tracking);
  const p = tracking[provider];
  if (!p.enabled) return "Padrão da conta: desativado";
  const id =
    provider === "ga4"
      ? tracking.ga4.measurementId
      : provider === "gtm"
        ? tracking.gtm.containerId
        : provider === "metaPixel"
          ? tracking.metaPixel.pixelId
          : tracking.googleAds.adsId;
  return `Padrão da conta: ${id.trim() || "não configurado"}`;
}

/**
 * Painel "Integrações" do editor da LP — override por página de tracking
 * e scripts. Campos vazios herdam o padrão da conta.
 */
export function IntegracoesPanel({
  form,
  accountConfig,
  onRestoreDefaults,
}: {
  form: LpEditorForm;
  accountConfig: GlobalConfig;
  onRestoreDefaults: () => void;
}) {
  const { office } = form;
  const tracking = normalizeTracking(office.tracking);
  const tags = office.tags;
  const seo: Partial<SeoMeta> = form.copy.seo ?? form.schema.seo ?? {};
  const indexable = seo.indexable ?? false;

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Esses campos valem só para esta página e sobrescrevem o padrão da conta.
        Deixe em branco para herdar o valor configurado em Configurações.
      </p>

      <FieldGroup title="Visibilidade nos buscadores">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            <Label htmlFor="lp-indexable" className="text-sm font-medium">
              Aparecer no Google?
            </Label>
            <p className="text-xs text-muted-foreground">
              Desligado por padrão — ideal para tráfego pago (Meta e Google
              Ads). Ative só se quiser indexação orgânica desta página.
            </p>
          </div>
          <Switch
            id="lp-indexable"
            checked={indexable}
            onCheckedChange={(checked) =>
              form.setSeoField("indexable", checked)
            }
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Tracking">
        <IntegrationProviderCard
          icon={<GoogleAnalytics className="size-4" />}
          name="Google Analytics 4"
          description="Measurement ID desta landing page."
          accountHint={accountProviderHint(accountConfig, "ga4")}
          enabled={tracking.ga4.enabled}
          onEnabledChange={(enabled) =>
            form.setTrackingProvider("ga4", { enabled })
          }
        >
          <Input
            value={tracking.ga4.measurementId}
            onChange={(e) =>
              form.setTrackingProvider("ga4", {
                measurementId: e.target.value,
              })
            }
            placeholder="G-XXXXXXXXXX"
            aria-label="GA4 Measurement ID"
          />
        </IntegrationProviderCard>

        <IntegrationProviderCard
          icon={<GoogleTagManager className="size-4" />}
          name="Google Tag Manager"
          description="Container ID desta landing page."
          accountHint={accountProviderHint(accountConfig, "gtm")}
          enabled={tracking.gtm.enabled}
          onEnabledChange={(enabled) =>
            form.setTrackingProvider("gtm", { enabled })
          }
        >
          <Input
            value={tracking.gtm.containerId}
            onChange={(e) =>
              form.setTrackingProvider("gtm", { containerId: e.target.value })
            }
            placeholder="GTM-XXXXXXX"
            aria-label="GTM Container ID"
          />
        </IntegrationProviderCard>

        <IntegrationProviderCard
          icon={<Meta className="size-4" />}
          name="Meta Pixel"
          description="Pixel para campanhas do Facebook e Instagram Ads."
          accountHint={accountProviderHint(accountConfig, "metaPixel")}
          enabled={tracking.metaPixel.enabled}
          onEnabledChange={(enabled) =>
            form.setTrackingProvider("metaPixel", { enabled })
          }
        >
          <Input
            value={tracking.metaPixel.pixelId}
            onChange={(e) =>
              form.setTrackingProvider("metaPixel", { pixelId: e.target.value })
            }
            placeholder="000000000000000"
            aria-label="Meta Pixel ID"
          />
        </IntegrationProviderCard>

        <IntegrationProviderCard
          icon={<GoogleAds className="size-4" />}
          name="Google Ads"
          description="Tag de conversão desta landing page."
          accountHint={accountProviderHint(accountConfig, "googleAds")}
          enabled={tracking.googleAds.enabled}
          onEnabledChange={(enabled) =>
            form.setTrackingProvider("googleAds", { enabled })
          }
        >
          <div className="flex flex-col gap-3">
            <Input
              value={tracking.googleAds.adsId}
              onChange={(e) =>
                form.setTrackingProvider("googleAds", { adsId: e.target.value })
              }
              placeholder="AW-XXXXXXXXX"
              aria-label="Google Ads ID"
            />
            <Input
              value={tracking.googleAds.conversionLabel}
              onChange={(e) =>
                form.setTrackingProvider("googleAds", {
                  conversionLabel: e.target.value,
                })
              }
              placeholder="AbC-D_efG-h12_34-567"
              aria-label="Rótulo de conversão Google Ads"
            />
          </div>
        </IntegrationProviderCard>
      </FieldGroup>

      <FieldGroup title="Scripts personalizados">
        <BuilderField
          label="Antes do </head>"
          hint="HTML/JS avançado (ex: tags extras de terceiros). Use com cuidado."
        >
          <AutoTextarea
            value={tags?.head ?? ""}
            onChange={(e) => form.setTag("head", e.target.value)}
            className="min-h-[70px] resize-y font-mono text-xs"
          />
        </BuilderField>
        <BuilderField label="Início do <body>">
          <AutoTextarea
            value={tags?.body ?? ""}
            onChange={(e) => form.setTag("body", e.target.value)}
            className="min-h-[70px] resize-y font-mono text-xs"
          />
        </BuilderField>
        <BuilderField label="Rodapé da página">
          <AutoTextarea
            value={tags?.footer ?? ""}
            onChange={(e) => form.setTag("footer", e.target.value)}
            className="min-h-[70px] resize-y font-mono text-xs"
          />
        </BuilderField>
      </FieldGroup>

      <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRestoreDefaults}
        >
          Restaurar padrão da conta
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href="/configuracoes">Abrir configuracoes globais</Link>
        </Button>
      </div>
    </div>
  );
}
