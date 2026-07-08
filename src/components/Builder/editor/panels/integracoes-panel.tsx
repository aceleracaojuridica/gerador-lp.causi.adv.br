"use client";

import {
  GoogleAds,
  GoogleAnalytics,
  GoogleTagManager,
  Meta,
} from "@thesvg/react";
import Link from "next/link";
import { AutoTextarea } from "@/components/auto-textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { GlobalConfig } from "@/lib/landing-pages/global-config";
import { BuilderField } from "../../shared/fields";
import { FieldGroup, Segmented } from "../controls/editor-controls";

const CAPTCHA_OPTIONS = [
  { id: "none", label: "Desativado" },
  { id: "turnstile", label: "Cloudflare Turnstile" },
] as const;

const WIDGET_THEME_OPTIONS = [
  { id: "auto", label: "Automático" },
  { id: "light", label: "Claro" },
  { id: "dark", label: "Escuro" },
] as const;

/** Padrão da conta ou "não configurado", usado como dica dos campos abaixo. */
function defaultHint(value: string) {
  return `Padrão da conta: ${value.trim() ? value : "não configurado"}`;
}

/**
 * Painel "Integrações" do editor da LP — override por página de tracking,
 * scripts e captcha. Campos vazios herdam o padrão da conta
 * (configurado em Configurações); ver `applyGlobalConfigToOffice`.
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
  const tracking = office.tracking;
  const tags = office.tags;
  const captcha = office.captcha;
  const provider = captcha?.provider ?? "none";

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-border bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        Esses campos valem só para esta página e sobrescrevem o padrão da conta.
        Deixe em branco para herdar o valor configurado em Configurações.
      </p>

      <FieldGroup title="Tracking">
        <BuilderField
          label="GA4 Measurement ID"
          hint={defaultHint(accountConfig.tracking.ga4MeasurementId)}
          labelAction={
            <GoogleAnalytics className="size-4 text-muted-foreground" />
          }
        >
          <Input
            value={tracking?.ga4MeasurementId ?? ""}
            onChange={(e) =>
              form.setTrackingField("ga4MeasurementId", e.target.value)
            }
            placeholder="G-XXXXXXXXXX"
          />
        </BuilderField>
        <BuilderField
          label="Google Tag Manager (container ID)"
          hint={defaultHint(accountConfig.tracking.gtmContainerId)}
          labelAction={
            <GoogleTagManager className="size-4 text-muted-foreground" />
          }
        >
          <Input
            value={tracking?.gtmContainerId ?? ""}
            onChange={(e) =>
              form.setTrackingField("gtmContainerId", e.target.value)
            }
            placeholder="GTM-XXXXXXX"
          />
        </BuilderField>
        <BuilderField
          label="Meta Pixel ID"
          hint={defaultHint(accountConfig.tracking.metaPixelId)}
          labelAction={<Meta className="size-4 text-muted-foreground" />}
        >
          <Input
            value={tracking?.metaPixelId ?? ""}
            onChange={(e) =>
              form.setTrackingField("metaPixelId", e.target.value)
            }
            placeholder="000000000000000"
          />
        </BuilderField>
        <BuilderField
          label="Google Ads ID"
          hint={defaultHint(accountConfig.tracking.googleAdsId)}
          labelAction={<GoogleAds className="size-4 text-muted-foreground" />}
        >
          <Input
            value={tracking?.googleAdsId ?? ""}
            onChange={(e) =>
              form.setTrackingField("googleAdsId", e.target.value)
            }
            placeholder="AW-XXXXXXXXX"
          />
        </BuilderField>
        <BuilderField
          label="Google Ads — rótulo de conversão"
          hint={defaultHint(accountConfig.tracking.googleAdsLabel)}
        >
          <Input
            value={tracking?.googleAdsLabel ?? ""}
            onChange={(e) =>
              form.setTrackingField("googleAdsLabel", e.target.value)
            }
            placeholder="AbC-D_efG-h12_34-567"
          />
        </BuilderField>
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

      <FieldGroup title="Captcha do formulário">
        <Segmented
          label="Provedor"
          value={provider}
          onChange={(v) => form.setCaptchaField("provider", v)}
          options={CAPTCHA_OPTIONS}
        />
        {provider === "turnstile" ? (
          <>
            <BuilderField label="Site key">
              <Input
                value={captcha?.siteKey ?? ""}
                onChange={(e) =>
                  form.setCaptchaField("siteKey", e.target.value)
                }
                placeholder="0x4AAAAAAA..."
              />
            </BuilderField>
            <Segmented
              label="Tema do widget"
              value={captcha?.widgetTheme ?? "auto"}
              onChange={(v) => form.setCaptchaField("widgetTheme", v)}
              options={WIDGET_THEME_OPTIONS}
            />
          </>
        ) : null}
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
