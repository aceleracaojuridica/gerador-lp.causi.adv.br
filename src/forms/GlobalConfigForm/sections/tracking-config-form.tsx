"use client";

import { GoogleAnalytics, GoogleTagManager } from "@thesvg/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { FieldRow } from "../shared/field-row";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

export function TrackingConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Trackeamento</CardTitle>
            <CardDescription>
              IDs padrao de analytics usados na publicacao real das landing
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="tracking.ga4MeasurementId"
              render={({ field }) => (
                <FieldRow
                  label={
                    <span className="inline-flex items-center gap-2">
                      <GoogleAnalytics className="size-4" />
                      GA4 Measurement ID
                    </span>
                  }
                  description="Formato esperado: G-XXXXXXXXXX."
                >
                  <FormControl>
                    <Input {...field} placeholder="G-XXXXXXXXXX" />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="tracking.gtmContainerId"
              render={({ field }) => (
                <FieldRow
                  label={
                    <span className="inline-flex items-center gap-2">
                      <GoogleTagManager className="size-4" />
                      Google Tag Manager
                    </span>
                  }
                  description="Container ID padrao para GTM."
                  borderless
                >
                  <FormControl>
                    <Input {...field} placeholder="GTM-XXXXXXX" />
                  </FormControl>
                </FieldRow>
              )}
            />
          </CardContent>

          <ConfigFormFooter form={form} defaultValues={defaultValues} />
        </Card>
      </form>
    </Form>
  );
}
