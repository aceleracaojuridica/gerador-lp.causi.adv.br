"use client";

import { GoogleAds, Meta } from "@thesvg/react";
import { IntegrationProviderCard } from "@/components/integrations/integration-provider-card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

export function PixelsConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <FormField
          control={form.control}
          name="tracking.metaPixel.enabled"
          render={({ field: enabledField }) => (
            <FormField
              control={form.control}
              name="tracking.metaPixel.pixelId"
              render={({ field: idField }) => (
                <IntegrationProviderCard
                  icon={<Meta className="size-4" />}
                  name="Meta Pixel"
                  description="Pixel de rastreamento para campanhas do Facebook e Instagram Ads."
                  enabled={enabledField.value}
                  onEnabledChange={enabledField.onChange}
                >
                  <FormControl>
                    <Input
                      {...idField}
                      placeholder="000000000000000"
                      aria-label="Meta Pixel ID"
                    />
                  </FormControl>
                </IntegrationProviderCard>
              )}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tracking.googleAds.enabled"
          render={({ field: enabledField }) => (
            <FormField
              control={form.control}
              name="tracking.googleAds.adsId"
              render={({ field: idField }) => (
                <FormField
                  control={form.control}
                  name="tracking.googleAds.conversionLabel"
                  render={({ field: labelField }) => (
                    <IntegrationProviderCard
                      icon={<GoogleAds className="size-4" />}
                      name="Google Ads"
                      description="Tag de conversao para campanhas do Google Ads."
                      enabled={enabledField.value}
                      onEnabledChange={enabledField.onChange}
                    >
                      <div className="flex flex-col gap-3">
                        <FormControl>
                          <Input
                            {...idField}
                            placeholder="AW-XXXXXXXXX"
                            aria-label="Google Ads ID"
                          />
                        </FormControl>
                        <FormControl>
                          <Input
                            {...labelField}
                            placeholder="AbC-D_efG-h12_34-567"
                            aria-label="Rotulo de conversao Google Ads"
                          />
                        </FormControl>
                      </div>
                    </IntegrationProviderCard>
                  )}
                />
              )}
            />
          )}
        />

        <ConfigFormFooter form={form} defaultValues={defaultValues} />
      </form>
    </Form>
  );
}
