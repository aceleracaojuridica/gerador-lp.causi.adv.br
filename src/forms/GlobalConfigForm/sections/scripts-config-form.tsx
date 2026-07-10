"use client";

import { AutoTextarea } from "@/components/auto-textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { FieldRow } from "../shared/field-row";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

export function ScriptsConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Scripts avancados</CardTitle>
            <CardDescription>
              Use somente quando os IDs estruturados nao cobrirem a integracao.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="tags.head"
              render={({ field }) => (
                <FieldRow
                  label="Antes do fechamento do head"
                  description="HTML/JS avancado injetado no head da landing page publicada."
                >
                  <FormControl>
                    <AutoTextarea
                      {...field}
                      className="min-h-[70px] resize-y font-mono text-xs"
                      placeholder="<script>...</script>"
                    />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="tags.body"
              render={({ field }) => (
                <FieldRow
                  label="Inicio do body"
                  description="Snippets renderizados no inicio do body."
                >
                  <FormControl>
                    <AutoTextarea
                      {...field}
                      className="min-h-[70px] resize-y font-mono text-xs"
                      placeholder="<script>...</script>"
                    />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="tags.footer"
              render={({ field }) => (
                <FieldRow
                  label="Rodape da pagina"
                  description="Scripts ou marcacoes extras para o final da pagina."
                  borderless
                >
                  <FormControl>
                    <AutoTextarea
                      {...field}
                      className="min-h-[70px] resize-y font-mono text-xs"
                      placeholder="<script>...</script>"
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
