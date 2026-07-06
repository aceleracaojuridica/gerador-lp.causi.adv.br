"use client";

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

export function PixelsConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Pixels de conversao</CardTitle>
            <CardDescription>
              IDs padrao usados para atribuir conversoes de anuncios nas landing
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="tracking.metaPixelId"
              render={({ field }) => (
                <FieldRow
                  label="Meta Pixel ID"
                  description="Use apenas numeros do pixel padrao da conta."
                >
                  <FormControl>
                    <Input {...field} placeholder="000000000000000" />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="tracking.googleAdsId"
              render={({ field }) => (
                <FieldRow
                  label="Google Ads ID"
                  description="Formato esperado: AW-XXXXXXXXX."
                >
                  <FormControl>
                    <Input {...field} placeholder="AW-XXXXXXXXX" />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="tracking.googleAdsLabel"
              render={({ field }) => (
                <FieldRow
                  label="Rotulo de conversao"
                  description="Label de conversao usado com o Google Ads."
                  borderless
                >
                  <FormControl>
                    <Input {...field} placeholder="AbC-D_efG-h12_34-567" />
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
