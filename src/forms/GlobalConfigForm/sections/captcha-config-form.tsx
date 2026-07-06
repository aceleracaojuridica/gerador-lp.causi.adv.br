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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GlobalConfigFormProps } from "../global-config-form.types";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { FieldRow } from "../shared/field-row";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

const CAPTCHA_OPTIONS = [
  { value: "none", label: "Desativado" },
  { value: "turnstile", label: "Cloudflare Turnstile" },
] as const;

const WIDGET_THEME_OPTIONS = [
  { value: "auto", label: "Automatico" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Escuro" },
] as const;

export function CaptchaConfigForm({ initialData }: GlobalConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });
  const captchaProvider = form.watch("captcha.provider");

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Captcha</CardTitle>
            <CardDescription>
              Configuracao padrao de protecao para os formularios das landing
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FormField
              control={form.control}
              name="captcha.provider"
              render={({ field }) => (
                <FieldRow
                  label="Provedor"
                  description="Selecione o captcha padrao publicado nas paginas."
                  borderless={captchaProvider !== "turnstile"}
                >
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um provedor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {CAPTCHA_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </FieldRow>
              )}
            />

            {captchaProvider === "turnstile" ? (
              <>
                <FormField
                  control={form.control}
                  name="captcha.siteKey"
                  render={({ field }) => (
                    <FieldRow
                      label="Site key"
                      description="Chave publica do Cloudflare Turnstile."
                    >
                      <FormControl>
                        <Input {...field} placeholder="0x4AAAAAAA..." />
                      </FormControl>
                    </FieldRow>
                  )}
                />

                <FormField
                  control={form.control}
                  name="captcha.widgetTheme"
                  render={({ field }) => (
                    <FieldRow
                      label="Tema do widget"
                      description="Aparencia padrao do Turnstile publicado."
                      borderless
                    >
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione um tema" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectGroup>
                            {WIDGET_THEME_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FieldRow>
                  )}
                />
              </>
            ) : null}
          </CardContent>

          <ConfigFormFooter form={form} defaultValues={defaultValues} />
        </Card>
      </form>
    </Form>
  );
}
