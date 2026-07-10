"use client";

import { Add, Check, CheckCircle, Refresh } from "@material-symbols-svg/react";
import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { InputMask } from "@/components/ui/input-mask";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import type { GlobalConfig } from "@/lib/landing-pages/global-config";
import { maskPhone } from "@/lib/landing-pages/phone";
import {
  normalizeOfficeSubdomainInput,
  validateOfficeSubdomainLocal,
} from "@/lib/landing-pages/subdomain";
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
  const [subdomainVerified, setSubdomainVerified] = useState(false);
  const [isValidatingSubdomain, setIsValidatingSubdomain] = useState(false);
  const [validateError, setValidateError] = useState<string | null>(null);
  const lastVerifiedSubdomainRef = useRef(initialOfficeSubdomain);

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
  const localSubdomainValidation = useMemo(
    () => validateOfficeSubdomainLocal(draftSubdomain),
    [draftSubdomain],
  );
  const isSubdomainDirty = draftSubdomain !== savedSubdomain;
  const canValidateSubdomain =
    canEditSubdomain &&
    isSubdomainDirty &&
    localSubdomainValidation.ok &&
    !isValidatingSubdomain;
  const canSaveSubdomain =
    canEditSubdomain &&
    isSubdomainDirty &&
    subdomainVerified &&
    draftSubdomain === lastVerifiedSubdomainRef.current &&
    !isSavingSubdomain;

  function onDraftSubdomainChange(value: string) {
    const normalized = normalizeOfficeSubdomainInput(value);
    setDraftSubdomain(normalized);
    setValidateError(null);
    if (normalized !== lastVerifiedSubdomainRef.current) {
      setSubdomainVerified(false);
    }
  }

  const onValidateSubdomain = useCallback(async () => {
    setValidateError(null);

    const local = validateOfficeSubdomainLocal(draftSubdomain);
    if (!local.ok) {
      setValidateError(local.message);
      setSubdomainVerified(false);
      return;
    }

    if (!canEditSubdomain) return;

    setIsValidatingSubdomain(true);
    try {
      const result = await checkSubdomainAvailabilityAction(draftSubdomain);
      if (result.available) {
        lastVerifiedSubdomainRef.current = draftSubdomain;
        setSubdomainVerified(true);
        setValidateError(null);
        return;
      }

      setSubdomainVerified(false);
      setValidateError(
        result.message ??
          (result.reason === "taken"
            ? "Este subdominio ja esta em uso por outro escritorio."
            : result.reason === "reserved"
              ? "Este subdominio esta reservado pelo nome de outro escritorio no Causi."
              : "Subdominio invalido."),
      );
    } catch {
      setSubdomainVerified(false);
      setValidateError("Erro ao validar o subdominio. Tente novamente.");
    } finally {
      setIsValidatingSubdomain(false);
    }
  }, [canEditSubdomain, draftSubdomain]);

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
    lastVerifiedSubdomainRef.current = result.officeSubdomain;
    setSubdomainVerified(false);
    setValidateError(null);
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
                <InputGroup
                  data-disabled={
                    !canEditSubdomain ||
                    isSavingSubdomain ||
                    isValidatingSubdomain
                  }
                >
                  <InputGroupInput
                    value={draftSubdomain}
                    onChange={(event) =>
                      onDraftSubdomainChange(event.target.value)
                    }
                    disabled={
                      !canEditSubdomain ||
                      isSavingSubdomain ||
                      isValidatingSubdomain
                    }
                    placeholder={suggestedSubdomain || "meu-escritorio"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-invalid={
                      (!localSubdomainValidation.ok && isSubdomainDirty) ||
                      !!validateError
                    }
                  />
                  <InputGroupAddon align="inline-end" className="pr-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InputGroupButton
                          type="button"
                          size="icon-md"
                          variant={
                            subdomainVerified
                              ? "input-addon"
                              : "input-addon-active"
                          }
                          disabled={!canValidateSubdomain}
                          onClick={() => void onValidateSubdomain()}
                          aria-label={
                            isValidatingSubdomain
                              ? "Validando subdominio"
                              : subdomainVerified
                                ? "Revalidar subdominio"
                                : "Validar subdominio"
                          }
                        >
                          {isValidatingSubdomain ? (
                            <Spinner size="sm" variant="primary" />
                          ) : subdomainVerified ? (
                            <Check />
                          ) : (
                            <Refresh />
                          )}
                        </InputGroupButton>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isValidatingSubdomain
                          ? "Validando..."
                          : subdomainVerified
                            ? "Revalidar subdominio"
                            : "Validar subdominio"}
                      </TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
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
                {isSubdomainDirty &&
                  !localSubdomainValidation.ok &&
                  !validateError && (
                    <p className="text-xs text-destructive">
                      {localSubdomainValidation.message}
                    </p>
                  )}
                {subdomainVerified && !validateError && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle className="size-3.5 shrink-0" />
                    Subdominio disponivel. Voce ja pode salvar.
                  </p>
                )}
                {!!validateError && (
                  <p className="text-xs text-destructive">{validateError}</p>
                )}
                {isSubdomainDirty &&
                  localSubdomainValidation.ok &&
                  !subdomainVerified &&
                  !validateError && (
                    <p className="text-xs text-muted-foreground">
                      Valide o subdominio para liberar o salvamento.
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
