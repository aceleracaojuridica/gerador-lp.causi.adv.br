"use client";

import { Add } from "@material-symbols-svg/react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import {
  checkSubdomainAvailabilityAction,
  updateOfficeSubdomainAction,
} from "@/app/actions/subdomain";
import { AutoTextarea } from "@/components/auto-textarea";
import { EstadoCidade } from "@/components/Builder/create/estado-cidade";
import { SocialsInput } from "@/components/Builder/create/socials-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import { maskPhone } from "@/lib/landing-pages/phone";
import { normalizeOfficeSubdomainInput } from "@/lib/landing-pages/subdomain";
import type { GlobalConfig } from "@/lib/landing-pages/global-config";
import { ConfigFormFooter } from "../shared/config-form-footer";
import { FieldRow } from "../shared/field-row";
import { FontSelect } from "../shared/font-select";
import { useGlobalConfigForm } from "../shared/use-global-config-form";

type VisualConfigFormProps = {
  initialData: GlobalConfig;
  initialOfficeSubdomain: string;
  accountName: string;
  canEditSubdomain: boolean;
};

export function VisualConfigForm({
  initialData,
  initialOfficeSubdomain,
  accountName,
  canEditSubdomain,
}: VisualConfigFormProps) {
  const { form, defaultValues, onSubmit } = useGlobalConfigForm({
    initialData,
  });
  const [savedSubdomain, setSavedSubdomain] = useState(initialOfficeSubdomain);
  const [draftSubdomain, setDraftSubdomain] = useState(initialOfficeSubdomain);
  const [isSavingSubdomain, setIsSavingSubdomain] = useState(false);
  const [availability, setAvailability] = useState<
    "idle" | "checking" | "available" | "invalid" | "taken" | "reserved"
  >("idle");

  const {
    fields: socials,
    append: appendSocial,
    remove: removeSocialAt,
    update: updateSocial,
  } = useFieldArray({ control: form.control, name: "socials" });

  const watchUf = form.watch("address.uf");
  const watchCidade = form.watch("address.cidade");
  const watchWhatsappDisplay = form.watch("contact.whatsappDisplay");

  function onPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    form.setValue("contact.whatsapp", digits ? `55${digits}` : "", {
      shouldDirty: true,
    });
    form.setValue("contact.whatsappDisplay", maskPhone(digits), {
      shouldDirty: true,
    });
  }

  function setSocialUrl(i: number, url: string) {
    updateSocial(i, { ...socials[i], url });
  }

  function addSocial() {
    appendSocial({ network: "instagram", url: "" });
  }

  const suggestedSubdomain = useMemo(
    () => normalizeOfficeSubdomainInput(accountName),
    [accountName],
  );
  const isSubdomainDirty = draftSubdomain !== savedSubdomain;
  const canSaveSubdomain =
    canEditSubdomain &&
    isSubdomainDirty &&
    availability !== "checking" &&
    availability !== "invalid" &&
    availability !== "taken" &&
    availability !== "reserved";

  useEffect(() => {
    if (!canEditSubdomain) return;
    if (!isSubdomainDirty) {
      setAvailability("idle");
      return;
    }

    let cancelled = false;
    setAvailability("checking");

    const timer = setTimeout(async () => {
      const result = await checkSubdomainAvailabilityAction(draftSubdomain);
      if (cancelled) return;
      if (result.available) {
        setAvailability("available");
        return;
      }
      if (result.reason === "taken") {
        setAvailability("taken");
        return;
      }
      if (result.reason === "reserved") {
        setAvailability("reserved");
        return;
      }
      setAvailability("invalid");
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canEditSubdomain, draftSubdomain, isSubdomainDirty]);

  async function onSaveSubdomain() {
    if (!canSaveSubdomain) return;
    setIsSavingSubdomain(true);
    const result = await updateOfficeSubdomainAction(draftSubdomain);
    setIsSavingSubdomain(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setSavedSubdomain(result.officeSubdomain);
    setDraftSubdomain(result.officeSubdomain);
    setAvailability("idle");
    toast.success("Subdominio atualizado com sucesso.");
  }

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6 pb-8">
        <Card>
          <CardHeader>
            <CardTitle>Tipografia da conta</CardTitle>
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
                  borderless
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subdominio da conta</CardTitle>
            <CardDescription>
              O subdominio define o host publico das landing pages:{" "}
              <span className="font-mono">{`{subdominio}.causi.adv.br`}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldRow
              label="Subdominio"
              description="Alterar este valor muda o host publico de todas as landing pages publicadas."
            >
              <div className="flex flex-col gap-2">
                <Input
                  value={draftSubdomain}
                  onChange={(event) => setDraftSubdomain(event.target.value)}
                  disabled={!canEditSubdomain || isSavingSubdomain}
                  placeholder={suggestedSubdomain || "meu-escritorio"}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Sugestao do nome no Causi: {suggestedSubdomain || "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  URL publica de exemplo:{" "}
                  <span className="font-mono">{`https://${draftSubdomain || "subdominio"}.causi.adv.br/previdenciario`}</span>
                </p>
                {!canEditSubdomain && (
                  <p className="text-xs text-muted-foreground">
                    Apenas o owner da conta pode alterar o subdominio.
                  </p>
                )}
                {availability === "checking" && (
                  <p className="text-xs text-muted-foreground">
                    Verificando disponibilidade...
                  </p>
                )}
                {availability === "available" && (
                  <p className="text-xs text-emerald-600">
                    Subdominio disponivel.
                  </p>
                )}
                {availability === "invalid" && (
                  <p className="text-xs text-destructive">
                    Formato invalido. Use kebab-case, 3-63 caracteres.
                  </p>
                )}
                {availability === "taken" && (
                  <p className="text-xs text-destructive">
                    Este subdominio ja esta em uso por outro escritorio.
                  </p>
                )}
                {availability === "reserved" && (
                  <p className="text-xs text-destructive">
                    Este subdominio esta reservado pelo nome de outro escritorio
                    no Causi.
                  </p>
                )}
                <Button
                  type="button"
                  onClick={onSaveSubdomain}
                  disabled={!canSaveSubdomain || isSavingSubdomain}
                >
                  {isSavingSubdomain ? "Salvando..." : "Salvar subdominio"}
                </Button>
              </div>
            </FieldRow>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato padrao</CardTitle>
            <CardDescription>
              Dados de contato pre-preenchidos por padrao na criacao de novas
              landing pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldRow
              label="WhatsApp"
              description="WhatsApp principal do escritorio (somente numeros)."
            >
              <InputMask
                mask="(00) 00000-0000"
                value={watchWhatsappDisplay ?? ""}
                onAccept={(value: string) => onPhone(value)}
                placeholder="(67) 99999-9999"
                inputMode="tel"
              />
            </FieldRow>

            <FormField
              control={form.control}
              name="contact.email"
              render={({ field }) => (
                <FieldRow
                  label="E-mail"
                  description="E-mail principal para contato."
                  borderless
                >
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="contato@escritorio.com.br"
                      autoComplete="email"
                    />
                  </FormControl>
                </FieldRow>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereco padrao</CardTitle>
            <CardDescription>
              Endereco fisico principal do escritorio para o rodape das landing
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <FieldRow
              label="Estado/Cidade"
              description="Selecione o estado e a cidade principal."
            >
              <EstadoCidade
                uf={watchUf ?? ""}
                cidade={watchCidade ?? ""}
                onChange={(novoUf, novaCidade) => {
                  form.setValue("address.uf", novoUf, { shouldDirty: true });
                  form.setValue("address.cidade", novaCidade, {
                    shouldDirty: true,
                  });
                }}
              />
            </FieldRow>

            <FormField
              control={form.control}
              name="address.address"
              render={({ field }) => (
                <FieldRow
                  label="Endereco"
                  description="Logradouro, numero, complemento e bairro."
                >
                  <FormControl>
                    <AutoTextarea
                      {...field}
                      className="min-h-[64px] resize-y"
                      placeholder={"Rua Exemplo, 123 — Sala 4\nBairro"}
                    />
                  </FormControl>
                </FieldRow>
              )}
            />

            <FormField
              control={form.control}
              name="address.mapsUrl"
              render={({ field }) => (
                <FieldRow
                  label="Google Maps"
                  description="Link da localizacao no Google Maps (opcional)."
                  borderless
                >
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://maps.app.goo.gl/..."
                      inputMode="url"
                    />
                  </FormControl>
                </FieldRow>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Redes sociais padrao</CardTitle>
            <CardDescription>
              Redes sociais pre-preenchidas por padrao nas novas landing pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="space-y-4">
              <SocialsInput
                socials={socials.map((s) => ({
                  network: s.network,
                  url: s.url,
                }))}
                onChange={setSocialUrl}
                onAdd={addSocial}
                onRemove={removeSocialAt}
                hideAddButton
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSocial}
                className="w-full"
              >
                <Add size={16} /> Adicionar rede social
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfigFormFooter form={form} defaultValues={defaultValues} />
      </form>
    </Form>
  );
}
