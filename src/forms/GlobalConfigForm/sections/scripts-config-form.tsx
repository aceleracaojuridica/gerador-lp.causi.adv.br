"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
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
            <div className="rounded-lg border border-yellow-200/50 bg-yellow-500/10 p-3 text-xs leading-relaxed text-yellow-600 dark:text-yellow-400">
              ⚠️ <strong>Políticas de Segurança Ativa:</strong> Para proteger as
              páginas, apenas scripts de origens autorizadas (como Google
              Analytics, GTM, Meta Pixel, TikTok, LinkedIn, Cloudflare e Google
              Calendar) são permitidos. Scripts de domínios desconhecidos ou
              chamadas perigosas (como eval e acesso a cookies/storage) serão
              rejeitados na validação.
            </div>

            <FormField
              control={form.control}
              name="tags.head"
              render={({ field }) => (
                <FieldRow
                  label="Antes do fechamento do head"
                  description="HTML/JS avancado injetado no head da landing page publicada."
                >
                  <FormControl>
                    <div className="flex flex-col gap-1.5 w-full">
                      <Textarea
                        {...field}
                        className="min-h-28 font-mono text-xs"
                        placeholder="<script>...</script>"
                      />
                      <FormMessage />
                    </div>
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
                    <div className="flex flex-col gap-1.5 w-full">
                      <Textarea
                        {...field}
                        className="min-h-28 font-mono text-xs"
                        placeholder="<script>...</script>"
                      />
                      <FormMessage />
                    </div>
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
                    <div className="flex flex-col gap-1.5 w-full">
                      <Textarea
                        {...field}
                        className="min-h-28 font-mono text-xs"
                        placeholder="<script>...</script>"
                      />
                      <FormMessage />
                    </div>
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
