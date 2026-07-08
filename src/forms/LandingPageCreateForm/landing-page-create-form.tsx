"use client";

import {
  Add,
  Call,
  Check,
  ChevronLeft,
  ChevronRight,
  Close,
  Delete,
  Domain,
  Movie,
  Palette,
  Photo,
  Upload,
} from "@material-symbols-svg/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { AutoTextarea } from "@/components/auto-textarea";
import { EstadoCidade } from "@/components/Builder/create/estado-cidade";
import { maskPhone } from "@/components/Builder/create/fields";
import { MelhorarTextoButton } from "@/components/Builder/create/melhorar-texto-button";
import { PalettePicker } from "@/components/Builder/create/palette-picker";
import { TemplateCard } from "@/components/Builder/create/template-card";
import CausiLogo from "@/components/icons/causi-logo";
import { SocialIcon } from "@/components/icons/social-icon";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { InputMask } from "@/components/ui/input-mask";
import { Progress } from "@/components/ui/progress";
import {
  detectLogoBackground,
  extractPalette,
} from "@/lib/landing-pages/colors";
import type { FocoCopy } from "@/lib/landing-pages/focos";
import { matchPalette } from "@/lib/landing-pages/palettes";
import { DEFAULT_THEME, type Theme } from "@/lib/landing-pages/schema";
import { detectNetwork } from "@/lib/landing-pages/socials";
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
const STEP_INFO = [
  {
    label: "Escritório",
    description: "Tema, nome e sobre o escritório",
    icon: Domain,
  },
  {
    label: "Contato",
    description: "WhatsApp, e-mail, endereço e redes",
    icon: Call,
  },
  {
    label: "Imagens",
    description: "Logo, fotos, vídeo e estrutura",
    icon: Photo,
  },
] as const;
const WIZARD_MAX_W = "mx-auto w-full max-w-3xl";
const ROW_BASE =
  "grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)] sm:gap-6";

/** Linha de campo: label/descrição à esquerda, controle à direita (estilo Configurações). */
function FieldRow({
  label,
  description,
  labelAction,
  children,
  borderless = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  labelAction?: ReactNode;
  children: ReactNode;
  borderless?: boolean;
}) {
  return (
    <FormItem
      className={cn(ROW_BASE, !borderless && "border-b border-border pb-5")}
    >
      <div className="space-y-1 sm:pt-2">
        <div className="flex items-center justify-between gap-2">
          <FormLabel>{label}</FormLabel>
          {labelAction ?? null}
        </div>
        {description ? <FormDescription>{description}</FormDescription> : null}
      </div>
      <div className="space-y-2">
        {children}
        <FormMessage />
      </div>
    </FormItem>
  );
}

/** Igual ao FieldRow, mas sem contexto de FormField (para controles avulsos). */
function PlainRow({
  label,
  description,
  children,
  borderless = false,
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  borderless?: boolean;
}) {
  return (
    <div className={cn(ROW_BASE, !borderless && "border-b border-border pb-5")}>
      <div className="space-y-1 sm:pt-2">
        <p className="text-sm font-medium leading-none text-foreground">
          {label}
        </p>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function LandingPageCreateForm(props: LandingPageCreateFormProps = {}) {
  const {
    defaultOfficeName = "",
    savedContacts = [],
  } = props;
  const router = useRouter();

  const form = useForm<LandingPageCreateFormValues>({
    defaultValues: landingPageCreateDefaultValues(props),
  });

  const { fields: diferenciais } = useFieldArray({
    control: form.control,
    name: "diferenciais",
  });

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
    about,
    whatsapp,
    whatsappDisplay,
    email,
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
  const [showLawyers, setShowLawyers] = useState(false);
  const hasSavedContacts = savedContacts.length > 0;
  const primarySavedContact =
    savedContacts.find((contact) => contact.is_primary) ?? savedContacts[0];
  const [selectedSavedContactId, setSelectedSavedContactId] = useState<
    string | null
  >(primarySavedContact ? String(primarySavedContact.id) : null);
  const isContactLocked = selectedSavedContactId !== null;

  // Ao trocar de etapa, rola o conteúdo de volta para o topo.
  const contentRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: rola ao mudar de etapa
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [step]);

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
  function setSocialUrl(i: number, url: string) {
    updateSocial(i, { network: detectNetwork(url), url });
  }
  function addSocial() {
    appendSocial({ network: "instagram", url: "" });
  }
  function removeSocial(i: number) {
    removeSocialAt(i);
  }

  // ── Image handlers ────────────────────────────────────────────────────────
  function onPhone(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 11);
    if (isContactLocked) return;
    form.setValue("whatsapp", digits ? `55${digits}` : "");
    form.setValue("whatsappDisplay", maskPhone(digits));
  }

  function applyContactToForm(contact: {
    whatsapp?: string | null;
    whatsapp_display?: string | null;
    email?: string | null;
  }) {
    form.setValue("whatsapp", contact.whatsapp ?? "", { shouldDirty: true });
    form.setValue("whatsappDisplay", contact.whatsapp_display ?? "", {
      shouldDirty: true,
    });
    form.setValue("email", contact.email ?? "", { shouldDirty: true });
  }

  function onSelectSavedContact(value: string) {
    if (value === "new") {
      setSelectedSavedContactId(null);
      form.setValue("whatsapp", "", { shouldDirty: true });
      form.setValue("whatsappDisplay", "", { shouldDirty: true });
      form.setValue("email", "", { shouldDirty: true });
      return;
    }

    const selectedContact = savedContacts.find(
      (contact) => String(contact.id) === value,
    );
    if (!selectedContact) return;
    setSelectedSavedContactId(String(selectedContact.id));
    applyContactToForm(selectedContact);
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

  function addLawyer() {
    form.setValue("lawyers", [
      ...form.getValues("lawyers"),
      { photo: "", name: "", role: "" },
    ]);
  }

  function onReplaceLawyerPhoto(i: number, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const next = form
        .getValues("lawyers")
        .map((l, idx) =>
          idx === i ? { ...l, photo: String(reader.result) } : l,
        );
      form.setValue("lawyers", next);
    };
    reader.readAsDataURL(file);
  }

  // ── Gera copy + imagens e salva a LP (passo final) ───────────────────────
  async function generateAndSaveLandingPage() {
    setErro("");
    setGerando(true);
    setGerandoMsg("Escrevendo a copy sobre o tema e selecionando as imagens…");

    const copyPayload = {
      name: defaultOfficeName.trim(),
      tema: tema.trim(),
      city: [addresses[0]?.cidade, addresses[0]?.uf].filter(Boolean).join("/"),
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
        e instanceof Error
          ? e.message
          : "Não foi possível gerar a copy agora. Verifique sua conexão e tente novamente.",
      );
      setGerando(false);
      setGerandoMsg("");
      return;
    }

    setGerandoMsg("Criando sua landing page…");

    const templateLayout = getTemplate(selectedTemplateId).layout;
    const savePayload = {
      name: defaultOfficeName.trim(),
      tema: tema.trim(),
      city: [addresses[0]?.cidade, addresses[0]?.uf].filter(Boolean).join("/"),
      whatsapp,
      whatsappDisplay,
      email: email.trim(),
      address: addresses[0]?.address.trim() ?? "",
      mapsUrl: addresses[0]?.mapsUrl.trim() ?? "",
      extraAddresses: addresses
        .slice(1)
        .map((a) => ({
          address: a.address.trim(),
          city: [a.cidade, a.uf].filter(Boolean).join("/"),
          mapsUrl: a.mapsUrl.trim(),
        }))
        .filter((a) => a.address),
      about: about.trim(),
      diferenciais: diferenciais.map((d) => d.val.trim()).filter(Boolean),
      videoId: videoId.trim(),
      logoSrc,
      logoBg,
      theme,
      lawyers: showLawyers ? lawyers.filter((l) => l.photo.trim()) : [],
      socials: socials
        .map((s) => ({ network: detectNetwork(s.url), url: s.url.trim() }))
        .filter((s) => s.url),
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
      router.push(`/lp/${data.slug}`);
    } catch (e) {
      console.error(e);
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível salvar a página agora. Verifique sua conexão e tente novamente.",
      );
      setGerando(false);
      setGerandoMsg("");
    }
  }

  // ── Validações por passo ─────────────────────────────────────────────────
  const temNome = defaultOfficeName.trim().length > 0;
  const temTema = tema.trim().length > 0;

  function avancar() {
    form.clearErrors();
    const zodError = validateWizardStep(step, form.getValues());
    if (zodError) {
      applyZodErrorsToForm(form, zodError);
      return;
    }
    if (step === 2) {
      if (!logoSrc) {
        setErro("Envie a logo do escritório para continuar.");
        return;
      }
      void generateAndSaveLandingPage();
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
              <CausiLogo
                className="relative size-10 animate-pulse"
                aria-hidden
              />
              <span className="sr-only">Gerando copy da landing page</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Criando a página de {defaultOfficeName}
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
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-card">
      {/* Cabeçalho em duas colunas */}
      <header className="flex shrink-0 border-b border-border">
        <div className="hidden shrink-0 border-r border-border px-[30px] py-5 md:block md:w-96">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Nova Landing Page
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monte sua página em 3 passos
          </p>
        </div>
        <div className="flex-1 py-4 md:py-5">
          <div
            className={cn(
              WIZARD_MAX_W,
              "flex items-center justify-between gap-4 px-4 sm:px-6",
            )}
          >
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold text-foreground">
                {STEP_INFO[step].label}
              </h2>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {STEP_INFO[step].description}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Corpo em duas colunas */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Sidebar interno — etapas */}
        <aside className="hidden shrink-0 flex-col justify-between overflow-y-auto border-r border-border px-[30px] py-4 md:flex md:w-96">
          <nav aria-label="Etapas do cadastro" className="space-y-1">
            {STEP_INFO.map((info, i) => {
              const done = i < step;
              const active = i === step;
              const clickable = i <= step;
              const Icon = info.icon;
              return (
                <button
                  key={info.label}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (clickable) setStep(i);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md p-2 text-left transition-colors md:p-3",
                    active && "bg-muted-foreground/10",
                    !active && clickable && "hover:bg-muted-foreground/5",
                    !clickable && "cursor-default opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-sm border bg-background",
                      active
                        ? "border-primary/30 text-primary"
                        : done
                          ? "border-primary/30 bg-primary/5 text-primary"
                          : "border-border text-muted-foreground",
                    )}
                  >
                    {done ? <Check size={18} /> : <Icon className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold text-foreground">
                      {info.label}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                      {info.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
          <div className="mt-4 space-y-1.5 px-1">
            <p className="text-xs font-medium text-muted-foreground">
              Passo {step + 1} de {STEPS.length} · {Math.round(progress)}%
            </p>
            <Progress value={progress} aria-label="Progresso do cadastro" />
          </div>
        </aside>

        {/* Conteúdo */}
        <div
          ref={contentRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          <div className={cn(WIZARD_MAX_W, "px-4 py-6 sm:px-6 md:py-8")}>
            {/* Indicador em telas pequenas (sem sidebar interno) */}
            <div className="mb-5 md:hidden">
              <Progress value={progress} aria-label="Progresso do cadastro" />
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Passo {step + 1} de {STEPS.length}
              </p>
            </div>
            <Form {...form}>
              <div className="space-y-5">
                {/* Passo 0 — Escritório */}
                {step === 0 ? (
                  <>
                    <FormField
                      control={form.control}
                      name="tema"
                      render={({ field }) => (
                        <FieldRow
                          label={
                            <>
                              Qual o tema da página?{" "}
                              <span className="text-muted-foreground">*</span>
                            </>
                          }
                        >
                          <FormControl>
                            <AutoTextarea
                              {...field}
                              className="min-h-[56px] resize-y"
                              placeholder="Ex: revisão de contratos com foco em abusos bancários"
                            />
                          </FormControl>
                        </FieldRow>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="about"
                      render={({ field }) => (
                        <FieldRow
                          label={
                            <>
                              Sobre o escritório{" "}
                              <span className="text-muted-foreground">*</span>
                            </>
                          }
                        >
                          <FormControl>
                            <InputGroup className="h-auto">
                              <InputGroupTextarea
                                {...field}
                                className="min-h-[80px] resize-y"
                                placeholder="Atuamos com dedicação na defesa de quem trabalha..."
                              />
                              <InputGroupAddon align="overlay-end">
                                <MelhorarTextoButton
                                  text={about}
                                  kind="sobre"
                                  office={{
                                    name: defaultOfficeName,
                                    product: tema,
                                  }}
                                  onResult={(text) =>
                                    form.setValue("about", text, {
                                      shouldDirty: true,
                                    })
                                  }
                                  iconOnly
                                />
                              </InputGroupAddon>
                            </InputGroup>
                          </FormControl>
                        </FieldRow>
                      )}
                    />
                  </>
                ) : null}

                {/* Passo 1 — Contato */}
                {step === 1 ? (
                  <>
                    {hasSavedContacts ? (
                      <PlainRow
                        label="Contato"
                        description="Selecione um contato salvo ou crie um novo."
                      >
                        <select
                          aria-label="Selecionar contato"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                          value={selectedSavedContactId ?? "new"}
                          onChange={(event) =>
                            onSelectSavedContact(event.target.value)
                          }
                        >
                          {savedContacts.map((contact, index) => (
                            <option key={String(contact.id)} value={contact.id}>
                              {contact.is_primary
                                ? "Principal"
                                : `Contato ${index + 1}`}{" "}
                              · {contact.whatsapp_display || "Sem WhatsApp"} ·{" "}
                              {contact.email || "Sem e-mail"}
                            </option>
                          ))}
                          <option value="new">Criar novo contato</option>
                        </select>
                      </PlainRow>
                    ) : null}

                    <FormField
                      control={form.control}
                      name="whatsapp"
                      render={() => (
                        <FieldRow
                          label={
                            <>
                              WhatsApp{" "}
                              <span className="text-muted-foreground">*</span>
                            </>
                          }
                        >
                          <FormControl>
                            <InputMask
                              mask="(00) 00000-0000"
                              value={whatsappDisplay}
                              onAccept={(value: string) => onPhone(value)}
                              placeholder="(67) 99999-9999"
                              inputMode="tel"
                              disabled={isContactLocked}
                            />
                          </FormControl>
                        </FieldRow>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FieldRow
                          label={
                            <>
                              E-mail{" "}
                              <span className="text-muted-foreground">*</span>
                            </>
                          }
                        >
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="contato@escritorio.com.br"
                              autoComplete="email"
                              disabled={isContactLocked}
                              onChange={(event) => {
                                if (isContactLocked) return;
                                field.onChange(event);
                              }}
                            />
                          </FormControl>
                        </FieldRow>
                      )}
                    />

                    <div className="space-y-5 border-b border-border pb-5">
                      <div className="space-y-3">
                        {addresses.map((a, i) => (
                          <div key={a.id} className="space-y-5">
                            {addresses.length > 0 ? (
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
                            <PlainRow label="Estado/Cidade">
                              <EstadoCidade
                                uf={a.uf}
                                cidade={a.cidade}
                                onChange={(novoUf, novaCidade) =>
                                  setAddressCity(i, novoUf, novaCidade)
                                }
                              />
                            </PlainRow>
                            <FormField
                              control={form.control}
                              name={`addresses.${i}.address`}
                              render={({ field }) => (
                                <FieldRow
                                  label={
                                    <>
                                      Endereço{" "}
                                      <span className="font-normal text-muted-foreground">
                                        (opcional)
                                      </span>
                                    </>
                                  }
                                >
                                  <FormControl>
                                    <AutoTextarea
                                      {...field}
                                      className="min-h-[64px] resize-y"
                                      placeholder={
                                        "Rua Exemplo, 123 — Sala 4\nEdifício Central\nBairro"
                                      }
                                    />
                                  </FormControl>
                                </FieldRow>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`addresses.${i}.mapsUrl`}
                              render={({ field }) => (
                                <FieldRow
                                  label={
                                    <>
                                      Google Maps{" "}
                                      <span className="font-normal text-muted-foreground">
                                        (opcional)
                                      </span>
                                    </>
                                  }
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
                          </div>
                        ))}
                      </div>
                      {form.formState.errors.addresses ? (
                        <FormField
                          control={form.control}
                          name="addresses"
                          render={() => (
                            <FormItem>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addAddress}
                        className="w-full"
                      >
                        <Add size={16} /> Adicionar endereço
                      </Button>
                    </div>

                    <div className="space-y-5">
                      <PlainRow
                        label={
                          <>
                            Redes sociais{" "}
                            <span className="font-normal text-muted-foreground">
                              (opcional)
                            </span>
                          </>
                        }
                        borderless
                      >
                        <div className="space-y-2">
                          {socials.map((social, i) => (
                            // biome-ignore lint/suspicious/noArrayIndexKey: social rows have no stable id
                            <div key={i} className="flex items-center gap-1.5">
                              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-input text-muted-foreground">
                                <SocialIcon
                                  network={detectNetwork(social.url)}
                                  size={16}
                                />
                              </span>
                              <Input
                                aria-label={`Link da rede ${i + 1}`}
                                value={social.url}
                                onChange={(e) => setSocialUrl(i, e.target.value)}
                                placeholder="Cole o link (Instagram, TikTok, YouTube...)"
                                inputMode="url"
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Remover rede"
                                onClick={() => removeSocial(i)}
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                              >
                                <Delete size={15} />
                              </Button>
                            </div>
                          ))}
                        </div>
                        {form.formState.errors.socials ? (
                          <FormField
                            control={form.control}
                            name="socials"
                            render={() => (
                              <FormItem>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ) : null}
                      </PlainRow>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addSocial}
                        className="w-full"
                      >
                        <Add size={16} /> Adicionar rede social
                      </Button>
                    </div>
                  </>
                ) : null}

                {/* Passo 2 — Imagens */}
                {step === 2 ? (
                  <>
                    {/* Logo */}
                    <div>
                      <PlainRow
                        label={
                          <>
                            Logo{" "}
                            <span className="text-muted-foreground">*</span>
                          </>
                        }
                        description={
                          <span className="text-xs">
                            Formato JPG ou PNG. Tamanho máximo 10MB
                          </span>
                        }
                      >
                        {logoSrc ? (
                          <div className="flex items-center gap-4">
                            {/* biome-ignore lint/performance/noImgElement: preview local da logo no wizard */}
                            <img
                              src={logoSrc}
                              alt="logo"
                              className="size-20 shrink-0 rounded-xl bg-white object-contain p-2 ring-1 ring-border"
                            />
                            <Button asChild variant="outline" size="sm">
                              <label className="cursor-pointer">
                                <Upload size={16} />
                                Alterar imagem
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                  className="hidden"
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) onLogo(f);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            </Button>
                          </div>
                        ) : (
                          <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/40 text-xs font-medium text-muted-foreground transition hover:border-muted-foreground/40 hover:bg-muted">
                            <Upload size={16} />
                            Enviar logo
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) onLogo(f);
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                        {autoTheme ? (
                          <div className="mt-1">
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
                              ].map((c, i) => (
                                <span
                                  key={`${i}-${c}`}
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
                      </PlainRow>
                    </div>

                    {/* Fotos dos advogados */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="show-lawyers"
                          checked={showLawyers}
                          onCheckedChange={(checked) =>
                            setShowLawyers(checked === true)
                          }
                        />
                        <label
                          htmlFor="show-lawyers"
                          className="cursor-pointer text-sm font-semibold text-foreground"
                        >
                          Adicionar advogado{" "}
                          <span className="font-normal text-muted-foreground">
                            (opcional)
                          </span>
                        </label>
                      </div>
                      {showLawyers ? (
                        <>
                          <div className="space-y-5">
                            {lawyers.map((l, i) => (
                              // biome-ignore lint/suspicious/noArrayIndexKey: as fotos não têm id estável
                              <div key={i} className="space-y-5">
                                <PlainRow
                                  label={
                                    <>
                                      Foto{" "}
                                      <span className="font-normal text-muted-foreground">
                                        (opcional)
                                      </span>
                                    </>
                                  }
                                  description={
                                    <span className="text-xs">
                                      Formato JPG ou PNG. Tamanho máximo 10MB
                                    </span>
                                  }
                                >
                                  {l.photo ? (
                                    <div className="flex items-center gap-4">
                                      <div className="relative shrink-0">
                                        {/* biome-ignore lint/performance/noImgElement: preview local da foto no wizard */}
                                        <img
                                          src={l.photo}
                                          alt={`advogado ${i + 1}`}
                                          className="h-24 w-20 rounded-xl object-cover ring-1 ring-border"
                                        />
                                        <button
                                          type="button"
                                          aria-label="Remover advogado"
                                          onClick={() =>
                                            form.setValue(
                                              "lawyers",
                                              lawyers.filter(
                                                (_, idx) => idx !== i,
                                              ),
                                            )
                                          }
                                          className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition hover:text-destructive"
                                        >
                                          <Close size={14} />
                                        </button>
                                      </div>
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                      >
                                        <label className="cursor-pointer">
                                          <Upload size={16} />
                                          Alterar imagem
                                          <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            className="hidden"
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              if (f) onReplaceLawyerPhoto(i, f);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-muted/40 text-xs font-medium text-muted-foreground transition hover:border-muted-foreground/40 hover:bg-muted">
                                        <Upload size={16} />
                                        Enviar foto
                                        <input
                                          type="file"
                                          accept="image/png,image/jpeg,image/webp"
                                          className="hidden"
                                          onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) onReplaceLawyerPhoto(i, f);
                                            e.target.value = "";
                                          }}
                                        />
                                      </label>
                                      {lawyers.length > 1 ? (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon-sm"
                                          aria-label="Remover advogado"
                                          onClick={() =>
                                            form.setValue(
                                              "lawyers",
                                              lawyers.filter(
                                                (_, idx) => idx !== i,
                                              ),
                                            )
                                          }
                                          className="shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                          <Close size={15} />
                                        </Button>
                                      ) : null}
                                    </div>
                                  )}
                                </PlainRow>
                                <FormField
                                  control={form.control}
                                  name={`lawyers.${i}.name`}
                                  render={({ field }) => (
                                    <FieldRow label="Nome">
                                      <FormControl>
                                        <Input
                                          {...field}
                                          className="h-10"
                                          placeholder="Nome do advogado"
                                        />
                                      </FormControl>
                                    </FieldRow>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`lawyers.${i}.role`}
                                  render={({ field }) => (
                                    <FieldRow label="Descrição" borderless>
                                      <FormControl>
                                        <AutoTextarea
                                          {...field}
                                          className="min-h-[64px] resize-y"
                                          placeholder="Ex: Sócia, OAB/SP 000 — atua em..."
                                        />
                                      </FormControl>
                                    </FieldRow>
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={addLawyer}
                            className="w-full"
                          >
                            <Add size={16} /> Adicionar advogado
                          </Button>
                        </>
                      ) : null}
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
                      As imagens de cenário (fundo do hero, dor, escritório e
                      solução) são selecionadas da biblioteca recomendada da
                      Causi. Você só envia logo e fotos das pessoas.
                    </p>
                  </>
                ) : null}

                {erro ? (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-xs text-destructive">
                    {erro}
                  </p>
                ) : null}

                <div className="flex justify-end gap-3 pt-2">
                  {step > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-11 flex-1"
                      onClick={() => setStep((s) => s - 1)}
                    >
                      <ChevronLeft size={16} />
                      Voltar
                    </Button>
                  ) : null}

                  <Button
                    type="button"
                    size="lg"
                    className={cn("h-11", step > 0 && "flex-1")}
                    disabled={!temNome || !temTema || gerando}
                    onClick={avancar}
                  >
                    {step === 2 ? (
                      "Criar e editar"
                    ) : (
                      <>
                        Próxima etapa
                        <ChevronRight size={16} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
