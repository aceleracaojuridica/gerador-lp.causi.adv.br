"use client";

import {
  Add,
  Check,
  ChevronLeft,
  ChevronRight,
  Close,
  Delete,
  Movie,
  Palette,
  Upload,
} from "@material-symbols-svg/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AutoTextarea } from "@/components/auto-textarea";
import { maskPhone } from "@/components/Builder/fields";
import { EstadoCidade } from "@/components/Builder/estado-cidade";
import { MelhorarTextoButton } from "@/components/Builder/melhorar-texto-button";
import { TemplateCard } from "@/components/Builder/template-card";
import CausiLogo from "@/components/icons/causi-logo";
import { PalettePicker } from "@/components/Builder/palette-picker";
import { SocialsInput } from "@/components/Builder/socials-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import { Progress } from "@/components/ui/progress";
import {
  detectLogoBackground,
  extractPalette,
} from "@/lib/landing-pages/colors";
import type { FocoCopy } from "@/lib/landing-pages/focos";
import { matchPalette } from "@/lib/landing-pages/palettes";
import { DEFAULT_THEME, type SocialNetwork, type Theme } from "@/lib/landing-pages/schema";
import {
  DEFAULT_TEMPLATE_ID,
  getTemplate,
  TEMPLATES,
} from "@/lib/landing-pages/templates";
import { extractYouTubeId } from "@/lib/landing-pages/youtube";
import { showAccessDeniedToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { LandingPageCreateFormProps } from "./landing-page-create-form.types";
import {
  applyZodErrorsToForm,
  type LandingPageCreateFormValues,
  landingPageCreateDefaultValues,
  validateWizardStep,
} from "./schema";

const STEPS = ["Escritório", "Contato", "Imagens"] as const;
const WIZARD_MAX_W = "mx-auto w-full max-w-2xl";

export function LandingPageCreateForm(
  _props: LandingPageCreateFormProps = {},
) {
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);

  const form = useForm<LandingPageCreateFormValues>({
    defaultValues: landingPageCreateDefaultValues(),
  });

  const {
    fields: diferenciais,
    append: appendDiferencial,
    remove: removeDiferencialAt,
  } = useFieldArray({ control: form.control, name: "diferenciais" });

  const {
    fields: addresses,
    append: appendAddress,
    remove: removeAddressAt,
    update: updateAddress,
  } = useFieldArray({ control: form.control, name: "addresses" });

  const {
    fields: socials,
    append: appendSocial,
    remove: removeSocialAt,
    update: updateSocial,
  } = useFieldArray({ control: form.control, name: "socials" });

  const values = form.watch();
  const {
    tema,
    name,
    about,
    whatsapp,
    whatsappDisplay,
    email,
    showAddress,
    showSocials,
    videoId,
    showVideo,
    logoSrc,
    logoBg,
    theme,
    autoTheme,
    lawyers,
  } = values;

  const [step, setStep] = useState(0);
  const [selectedTemplateId, setSelectedTemplateId] =
    useState(DEFAULT_TEMPLATE_ID);

  // ── Loading / error state ─────────────────────────────────────────────────
  const [gerando, setGerando] = useState(false);
  const [gerandoMsg, setGerandoMsg] = useState("");
  const [erro, setErro] = useState("");

  // ── Address helpers ───────────────────────────────────────────────────────
  function setAddressCity(i: number, uf: string, cidade: string) {
    const current = form.getValues(`addresses.${i}`);
    updateAddress(i, { ...current, uf, cidade });
  }
  function addAddress() {
    appendAddress({
      address: "",
      uf: "",
      cidade: "",
      mapsUrl: "",
      showMaps: false,
    });
  }
  function removeAddress(i: number) {
    removeAddressAt(i);
  }

  // ── Social helpers ────────────────────────────────────────────────────────
  function setSocialField(i: number, key: "network" | "url", value: string) {
    const current = form.getValues(`socials.${i}`);
    updateSocial(i, {
      ...current,
      [key]: key === "network" ? (value as SocialNetwork) : value,
    });
  }
  function addSocial() {
    appendSocial({ network: "instagram", url: "" });
  }
  function removeSocial(i: number) {
    removeSocialAt(i);
  }

  // ── Diferenciais helpers ──────────────────────────────────────────────────
  function addDiferencial() {
    appendDiferencial({ val: "" });
  }
  function removeDiferencial(i: number) {
    removeDiferencialAt(i);
  }

  // ── Image handlers ────────────────────────────────────────────────────────
  function onPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    form.setValue("whatsapp", digits ? `55${digits}` : "");
    form.setValue("whatsappDisplay", maskPhone(digits));
  }

  function onLogo(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      form.setValue("logoSrc", dataUrl);
      const img = new Image();
      img.onload = () => {
        const pal = extractPalette(img);
        form.setValue("theme", pal);
        form.setValue("logoBg", detectLogoBackground(img));
        form.setValue(
          "autoTheme",
          pal.brand !== DEFAULT_THEME.brand ||
          pal.accent !== DEFAULT_THEME.accent,
        );
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function applyPalette(t: Theme) {
    form.setValue("theme", t);
    form.setValue("autoTheme", true);
  }

  function onAddPhotos(files: FileList) {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        form.setValue("lawyers", [
          ...form.getValues("lawyers"),
          { photo: String(reader.result), name: "", role: "" },
        ]);
      reader.readAsDataURL(file);
    });
  }

  // ── Gera copy + imagens e salva a LP (passo final) ───────────────────────
  async function criarEEditar() {
    setErro("");
    setGerando(true);
    setGerandoMsg("Escrevendo a copy sobre o tema e buscando as imagens…");

    const copyPayload = {
      name: name.trim(),
      tema: tema.trim(),
      city: showAddress
        ? [addresses[0]?.cidade, addresses[0]?.uf].filter(Boolean).join("/")
        : "",
      about: about.trim(),
      diferenciais: diferenciais.map((d) => d.val.trim()).filter(Boolean),
    };

    let generatedCopy: FocoCopy;
    let generatedImages: {
      hero: string;
      dor: string;
      sobre: string;
      solucao: string;
    };

    try {
      const copyRes = await fetch("/api/gerar-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyPayload),
      });
      const copyData = (await copyRes.json().catch(() => ({}))) as {
        error?: string;
        copy?: FocoCopy;
        images?: typeof generatedImages;
      };
      if (copyRes.status === 403 || copyData.error?.includes("acesso")) {
        showAccessDeniedToast();
        setGerando(false);
        return;
      }
      if (!copyRes.ok || !copyData.copy) {
        throw new Error(copyData.error || "Falha ao gerar a copy.");
      }
      generatedCopy = copyData.copy;
      generatedImages = copyData.images ?? {
        hero: "",
        dor: "",
        sobre: "",
        solucao: "",
      };
    } catch (e) {
      console.error(e);
      setErro(
        "Não foi possível gerar a copy agora. Verifique sua conexão e tente novamente.",
      );
      setGerando(false);
      setGerandoMsg("");
      return;
    }

    setGerandoMsg("Criando sua landing page…");

    const templateLayout = getTemplate(selectedTemplateId).layout;
    const savePayload = {
      name: name.trim(),
      tema: tema.trim(),
      city: showAddress
        ? [addresses[0]?.cidade, addresses[0]?.uf].filter(Boolean).join("/")
        : "",
      whatsapp,
      whatsappDisplay,
      email: email.trim(),
      address: showAddress ? (addresses[0]?.address.trim() ?? "") : "",
      mapsUrl: showAddress ? (addresses[0]?.mapsUrl.trim() ?? "") : "",
      extraAddresses: showAddress
        ? addresses
            .slice(1)
            .map((a) => ({
              address: a.address.trim(),
              city: [a.cidade, a.uf].filter(Boolean).join("/"),
              mapsUrl: a.mapsUrl.trim(),
            }))
            .filter((a) => a.address)
        : [],
      about: about.trim(),
      diferenciais: diferenciais.map((d) => d.val.trim()).filter(Boolean),
      videoId: videoId.trim(),
      logoSrc,
      logoBg,
      theme,
      lawyers,
      socials: showSocials
        ? socials.map((s) => ({ ...s, url: s.url.trim() })).filter((s) => s.url)
        : [],
      copy: generatedCopy,
      images: generatedImages,
      layout: templateLayout,
    };

    try {
      const res = await fetch("/api/gerar-lp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slug?: string;
      };
      if (res.status === 403 || data.error?.includes("acesso")) {
        showAccessDeniedToast();
        setGerando(false);
        return;
      }
      if (!res.ok || !data.slug)
        throw new Error(data.error || "Falha ao salvar a página.");
      router.push(`/lp/${data.slug}?novo=1`);
    } catch (e) {
      console.error(e);
      setErro(
        "Não foi possível salvar a página agora. Verifique sua conexão e tente novamente.",
      );
      setGerando(false);
      setGerandoMsg("");
    }
  }

  // ── Validações por passo ─────────────────────────────────────────────────
  const temNome = name.trim().length > 0;
  const temTema = tema.trim().length > 0;

  function avancar() {
    form.clearErrors();
    const zodError = validateWizardStep(step, form.getValues());
    if (zodError) {
      applyZodErrorsToForm(form, zodError);
      return;
    }
    if (step === 2) {
      void criarEEditar();
    } else {
      setStep((s) => s + 1);
    }
  }

  // ── Tela de loading ──────────────────────────────────────────────────────
  if (gerando) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center overflow-hidden bg-muted/15 px-4 sm:px-6">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8">
            <div className="relative mx-auto mb-5 flex size-16 items-center justify-center">
              <CausiLogo className="relative size-10 animate-pulse" aria-hidden />
              <span className="sr-only">Gerando copy da landing page</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Criando a página de {name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {gerandoMsg ||
                "Escrevendo a copy, buscando imagens e montando sua landing page. Leva alguns segundos."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps 0–2: formulário dentro do Card ─────────────────────────────────
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-muted/15">
      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-card/80">

        <div className={cn(WIZARD_MAX_W, "space-y-3")}>

          <div className="flex items-start justify-between gap-4">

            <div className="min-w-0 space-y-0.5">

              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Passo {step + 1} de {STEPS.length} <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground tabular-nums">
                  {Math.round(progress)}%
                </span>
              </p>
              <p className="truncate text-base font-semibold text-foreground sm:text-lg">
                {STEPS[step]}
              </p>
            </div>

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ml-2 shrink-0 text-muted-foreground"
            >
              <Link href="/">
                <Close size={16} />
                Sair
              </Link>
            </Button>
          </div>

          <Progress value={progress} aria-label="Progresso do cadastro" />


          <nav
            aria-label="Etapas do cadastro"
            className="hidden items-center gap-1 overflow-x-auto pb-0.5 sm:flex"
          >

            {STEPS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <Fragment key={label}>
                  {i > 0 ? (
                    <div
                      className={cn(
                        "mx-1 h-px w-6 shrink-0",
                        done ? "bg-primary/40" : "bg-border",
                      )}
                    />
                  ) : null}
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => {
                      if (done) setStep(i);
                    }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition",
                      active && "bg-primary/10 text-primary",
                      done &&
                      !active &&
                      "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !done &&
                      !active &&
                      "cursor-default text-muted-foreground/50",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-semibold",
                        active && "bg-primary text-primary-foreground",
                        done &&
                        !active &&
                        "border border-primary/30 bg-primary/5 text-primary",
                        !done &&
                        !active &&
                        "border border-border/70 text-muted-foreground/60",
                      )}
                    >
                      {done && !active ? <Check size={12} /> : i + 1}
                    </span>
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                </Fragment>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className={cn(WIZARD_MAX_W, "px-4 py-5 sm:px-6 md:py-8")}>
          <Card className="shadow-sm">
            <CardContent className="space-y-5 pt-6">
              <Form {...form}>
              {/* Passo 0 — Escritório */}
              {step === 0 ? (
                <>
                  <FormField
                    control={form.control}
                    name="tema"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Qual o tema da página?{" "}
                          <span className="text-muted-foreground">*</span>
                        </FormLabel>
                        <FormControl>
                          <AutoTextarea
                            {...field}
                            className="min-h-[56px] resize-y"
                            placeholder="Ex: revisão de contratos com foco em abusos bancários"
                          />
                        </FormControl>
                        <FormDescription>
                          O foco da página. Ex: &quot;direito previdenciário,
                          foco em BPC/LOAS&quot; ou &quot;revisão de contratos
                          bancários&quot;.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nome do escritório / advogado{" "}
                          <span className="text-muted-foreground">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Garcia & Klemann"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="about"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between gap-2">
                          <FormLabel>
                            Sobre o escritório{" "}
                            <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <MelhorarTextoButton
                            text={about}
                            kind="sobre"
                            office={{ name, product: tema }}
                            onResult={(text) => form.setValue("about", text)}
                            iconOnly
                          />
                        </div>
                        <FormControl>
                          <AutoTextarea
                            {...field}
                            className="min-h-[80px] resize-y"
                            placeholder="Atuamos com dedicação na defesa de quem trabalha..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Diferenciais</FormLabel>
                    <FormDescription>
                      Pontos fortes do escritório que a IA usa para personalizar
                      a copy. Opcional.
                    </FormDescription>
                    <div className="space-y-2">
                      {diferenciais.map((d, i) => (
                        <FormField
                          key={d.id}
                          control={form.control}
                          name={`diferenciais.${i}.val`}
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-center gap-2">
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Ex: atendimento personalizado e humanizado"
                                  />
                                </FormControl>
                                {diferenciais.length > 1 ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Remover diferencial"
                                    onClick={() => removeDiferencial(i)}
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Close size={15} />
                                  </Button>
                                ) : null}
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addDiferencial}
                        className="w-full"
                      >
                        <Add size={16} /> Adicionar diferencial
                      </Button>
                    </div>
                  </FormItem>
                </>
              ) : null}

              {/* Passo 1 — Contato */}
              {step === 1 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={() => (
                        <FormItem>
                          <FormLabel>
                            WhatsApp{" "}
                            <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <FormControl>
                            <InputMask
                              mask="(00) 00000-0000"
                              value={whatsappDisplay}
                              onAccept={(value: string) => onPhone(value)}
                              placeholder="(67) 99999-9999"
                              inputMode="tel"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            E-mail{" "}
                            <span className="text-muted-foreground">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contato@escritorio.com.br"
                              autoComplete="email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="showAddress"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-semibold">Endereço</FormLabel>
                      </FormItem>
                    )}
                  />
                  {showAddress ? (
                    <>
                      <div className="space-y-3">
                        {addresses.map((a, i) => (
                          <div key={a.id} className="space-y-2">
                            {addresses.length > 1 ? (
                              <div className="flex items-center gap-2">
                                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                                  Endereço {i + 1}
                                </span>
                                <div className="flex-1 border-t border-dashed border-border" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Remover endereço"
                                  onClick={() => removeAddress(i)}
                                  className="shrink-0 text-muted-foreground hover:text-destructive"
                                >
                                  <Delete size={15} />
                                </Button>
                              </div>
                            ) : null}
                            <FormField
                              control={form.control}
                              name={`addresses.${i}.address`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <AutoTextarea
                                      {...field}
                                      className="min-h-[64px] resize-y"
                                      placeholder={
                                        "Rua Exemplo, 123 — Sala 4\nEdifício Central\nBairro"
                                      }
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <EstadoCidade
                              uf={a.uf}
                              cidade={a.cidade}
                              onChange={(novoUf, novaCidade) =>
                                setAddressCity(i, novoUf, novaCidade)
                              }
                            />
                            <FormField
                              control={form.control}
                              name={`addresses.${i}.showMaps`}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        const current = form.getValues(
                                          `addresses.${i}`,
                                        );
                                        updateAddress(i, {
                                          ...current,
                                          showMaps: checked === true,
                                          mapsUrl:
                                            checked === true
                                              ? current.mapsUrl
                                              : "",
                                        });
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal text-muted-foreground">
                                    Link do Google Maps{" "}
                                    <span className="text-muted-foreground/70">
                                      (opcional)
                                    </span>
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                            {a.showMaps ? (
                              <FormField
                                control={form.control}
                                name={`addresses.${i}.mapsUrl`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        placeholder="https://maps.app.goo.gl/..."
                                        inputMode="url"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <FormField
                        control={form.control}
                        name="addresses"
                        render={() => (
                          <FormItem>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addAddress}
                        className="mt-2 w-full"
                      >
                        <Add size={16} /> Adicionar endereço
                      </Button>
                    </>
                  ) : null}

                  <FormField
                    control={form.control}
                    name="showSocials"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="font-semibold">
                          Redes sociais{" "}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {showSocials ? (
                    <>
                      <SocialsInput
                        socials={socials}
                        onChange={setSocialField}
                        onAdd={addSocial}
                        onRemove={removeSocial}
                      />
                      <FormField
                        control={form.control}
                        name="socials"
                        render={() => (
                          <FormItem>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  ) : null}
                </>
              ) : null}

              {/* Passo 2 — Imagens */}
              {step === 2 ? (
                <>
                  {/* Logo */}
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">Logo</p>
                    <input
                      ref={logoRef}
                      type="file"
                      aria-label="Enviar logo"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onLogo(f);
                        e.target.value = "";
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => logoRef.current?.click()}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
                      >
                        <Upload size={16} />
                        {logoSrc ? "Trocar logo" : "Enviar logo"}
                      </button>
                      {logoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={logoSrc}
                          alt="logo"
                          className="h-12 w-12 rounded object-contain ring-1 ring-gray-200"
                        />
                      ) : null}
                    </div>
                    {autoTheme ? (
                      <div className="mt-2">
                        <p className="inline-flex items-center gap-1 text-xs text-success">
                          <Palette size={13} />{" "}
                          {matchPalette(theme)
                            ? "Paleta selecionada"
                            : "Cores extraídas da logo"}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          {[
                            theme.brand,
                            theme.brandDark,
                            theme.accent,
                            theme.accentSoft,
                            theme.cream,
                          ].map((c) => (
                            <span
                              key={c}
                              className="h-6 w-6 rounded-full border border-gray-200"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        <PalettePicker
                          value={theme}
                          onPick={applyPalette}
                          className="mt-3 border-t border-gray-100 pt-3"
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* Fotos dos advogados */}
                  <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">
                      Fotos dos advogados{" "}
                      <span className="font-normal text-gray-400">(opcional)</span>
                    </p>
                    <input
                      ref={photosRef}
                      type="file"
                      multiple
                      aria-label="Enviar fotos dos advogados"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.length) onAddPhotos(e.target.files);
                        e.target.value = "";
                      }}
                    />
                    {lawyers.length > 0 ? (
                      <div className="mb-2 space-y-2">
                        {lawyers.map((l, i) => (
                          <div
                            key={l.photo?.trim().toLowerCase() ?? i}
                            className="flex items-start gap-2 rounded-lg border border-border p-2"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={l.photo}
                              alt={`advogado ${i + 1}`}
                              className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-border"
                            />
                            <div className="flex min-w-0 flex-1 flex-col gap-2">
                              <FormField
                                control={form.control}
                                name={`lawyers.${i}.name`}
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormControl>
                                      <Input
                                        {...field}
                                        className="h-8 text-xs"
                                        placeholder="Nome"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`lawyers.${i}.role`}
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormControl>
                                      <AutoTextarea
                                        {...field}
                                        className="min-h-[48px] resize-y text-xs"
                                        placeholder="Função / descrição (ex: Sócia, OAB/SP 000 — atua em...)"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remover advogado"
                              onClick={() =>
                                form.setValue(
                                  "lawyers",
                                  lawyers.filter((_, idx) => idx !== i),
                                )
                              }
                              className="shrink-0 text-muted-foreground"
                            >
                              <Close size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => photosRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:bg-gray-50"
                    >
                      <Upload size={16} />
                      {lawyers.length > 0
                        ? "Adicionar mais fotos"
                        : "Enviar fotos dos advogados"}
                    </button>
                  </div>

                  {/* Vídeo */}
                  <FormField
                    control={form.control}
                    name="showVideo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              if (!checked) form.setValue("videoId", "");
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-semibold">
                          Vídeo do YouTube{" "}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  {showVideo ? (
                    <FormField
                      control={form.control}
                      name="videoId"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center gap-2">
                            <Movie
                              size={16}
                              className="shrink-0 text-muted-foreground"
                            />
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    extractYouTubeId(e.target.value),
                                  )
                                }
                                placeholder="Cole o link do YouTube (ex: youtube.com/watch?v=...)"
                              />
                            </FormControl>
                          </div>
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <div>
                    <p className="mb-1.5 text-sm font-medium text-gray-700">
                      Estrutura inicial{" "}
                      <span className="font-normal text-gray-400">
                        (opcional)
                      </span>
                    </p>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                      Você pode escolher uma destas opções prontas para uso ou
                      editar o seu depois no editor.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {TEMPLATES.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          selected={selectedTemplateId === template.id}
                          onSelect={() => setSelectedTemplateId(template.id)}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    As imagens de cenário (fundo do hero, dor, escritório) o Claude
                    busca na Unsplash conforme o tema. Você só envia logo e fotos
                    das pessoas.
                  </p>
                </>
              ) : null}

              {erro ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                  {erro}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                {step > 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                    onClick={() => setStep((s) => s - 1)}
                  >
                    <ChevronLeft size={16} />
                    Voltar
                  </Button>
                ) : (
                  <span className="hidden sm:block" />
                )}

                <Button
                  type="button"
                  size="lg"
                  className="h-11 w-full sm:ml-auto sm:h-10 sm:w-auto sm:min-w-44"
                  disabled={!temNome || !temTema || gerando}
                  onClick={avancar}
                >
                  {step === 2 ? (
                    <>Criar e editar</>
                  ) : (
                    <>
                      Próxima etapa
                      <ChevronRight size={16} />
                    </>
                  )}
                </Button>
              </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
