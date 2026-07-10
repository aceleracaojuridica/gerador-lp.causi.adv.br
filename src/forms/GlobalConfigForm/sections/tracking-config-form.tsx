"use client";

import { GoogleAnalytics, GoogleTagManager } from "@thesvg/react";
import { IntegrationProviderCard } from "@/components/integrations/integration-provider-card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

export function TrackingConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <FormField
          control={form.control}
          name="tracking.ga4.enabled"
          render={({ field: enabledField }) => (
            <FormField
              control={form.control}
              name="tracking.ga4.measurementId"
              render={({ field: idField }) => (
                <IntegrationProviderCard
                  icon={<GoogleAnalytics className="size-4" />}
                  name="Google Analytics 4"
                  description="Measurement ID para campanhas e analytics na landing page."
                  enabled={enabledField.value}
                  onEnabledChange={enabledField.onChange}
                >
                  <FormControl>
                    <Input
                      {...idField}
                      placeholder="G-XXXXXXXXXX"
                      aria-label="GA4 Measurement ID"
                    />
                  </FormControl>
                </IntegrationProviderCard>
              )}
            />
          )}
        />

        <FormField
          control={form.control}
          name="tracking.gtm.enabled"
          render={({ field: enabledField }) => (
            <FormField
              control={form.control}
              name="tracking.gtm.containerId"
              render={({ field: idField }) => (
                <IntegrationProviderCard
                  icon={<GoogleTagManager className="size-4" />}
                  name="Google Tag Manager"
                  description="Container ID para tags de conversao e remarketing."
                  enabled={enabledField.value}
                  onEnabledChange={enabledField.onChange}
                >
                  <FormControl>
                    <Input
                      {...idField}
                      placeholder="GTM-XXXXXXX"
                      aria-label="GTM Container ID"
                    />
                  </FormControl>
                </IntegrationProviderCard>
              )}
            />
          )}
        />

        <ConfigFormFooter form={form} defaultValues={defaultValues} />
      </form>
    </Form>
  );
}
