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
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { FieldRow } from "../shared/field-row";
import { FontSelect } from "../shared/font-select";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

export function VisualConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Padrao da conta</CardTitle>
            <CardDescription>
              Esses valores alimentam novas landing pages e servem como base
              para overrides no editor.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="fonts.heading"
              render={({ field }) => (
                <FieldRow
                  label="Fonte dos titulos"
                  description="Escolha a tipografia padrao dos titulos das landing pages."
                >
                  <FontSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione uma fonte"
                    options={HEADING_FONTS}
                  />
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="fonts.body"
              render={({ field }) => (
                <FieldRow
                  label="Fonte do texto"
                  description="Define a fonte padrao para paragrafos, listas e textos auxiliares."
                >
                  <FontSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Selecione uma fonte"
                    options={BODY_FONTS}
                  />
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="domain"
              render={({ field }) => (
                <FieldRow
                  label="Dominio padrao"
                  description="Informe apenas o dominio final, sem https:// ou caminhos."
                  borderless
                >
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="lp.seudominio.com.br"
                      autoComplete="off"
                    />
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
