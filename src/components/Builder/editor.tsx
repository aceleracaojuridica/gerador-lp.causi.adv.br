"use client";

import {
  AccountBalance,
  Add,
  AddPhotoAlternate,
  Apartment,
  Article,
  Badge,
  Balance,
  Calculate,
  Campaign,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChildCare,
  Close,
  CloudOff,
  ContactPage,
  Dashboard,
  Delete,
  Description,
  DesktopWindows,
  Devices,
  DirectionsCar,
  Draft,
  DragIndicator,
  FormatListNumbered,
  Gavel,
  GppBad,
  GridView,
  Groups,
  Handshake,
  Help,
  Home,
  HowToReg,
  Image,
  KeyboardArrowDown,
  LaptopMac,
  LeftPanelClose,
  LeftPanelOpen,
  Lightbulb,
  Lock,
  MonitorHeart,
  Movie,
  Notes,
  NotificationsActive,
  OpenWith,
  Paid,
  Palette,
  Payments,
  ProgressActivity,
  Savings,
  Schedule,
  Search,
  SentimentDissatisfied,
  Star,
  Stethoscope,
  Storefront,
  SwapVert,
  Tablet,
  Timer,
  Trophy,
  Tune,
  Undo,
  Upload,
  VerifiedUser,
  Visibility,
  WandStars,
  Warning,
  Web,
  Work,
} from "@material-symbols-svg/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  publishLpAction,
  saveLpAction,
  unpublishLpAction,
} from "@/app/actions/lps";
import { AutoTextarea } from "@/components/auto-textarea";
import {
  DevicePreview,
  type Viewport,
} from "@/components/Preview/device-preview";
import { LandingPreview } from "@/components/Preview/landing-preview";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ZoomableImage } from "@/components/zoomable-image";
import { useIsLgUp } from "@/hooks/use-media-query";
import { isAccessDeniedError } from "@/lib/errors";
import { LazyImageSlot } from "@/components/Builder/image-picker-dialog";
import {
  AREAS_CTA_FALLBACK,
  CTA_PRIMARY,
  CTA_SECONDARY,
  GENERIC_ETAPAS,
} from "@/lib/landing-pages/focos";
import { ICON_KEYS } from "@/lib/landing-pages/icons";
import { publicLpDisplayHost, publicLpUrl } from "@/lib/landing-pages/lp-url";
import {
  type ImagemMelhorada,
  melhorarImagem,
} from "@/lib/landing-pages/melhorar-imagem";
import { matchPalette } from "@/lib/landing-pages/palettes";
import type {
  CustomSection,
  EquipeVariant,
  Lawyer,
  Layout,
  PopupQuestion,
  SectionImageKey,
  SeoMeta,
  StoredLp,
  Tone,
} from "@/lib/landing-pages/schema";
import {
  SEO_DESC_IDEAL,
  SEO_DESC_MAX,
  SEO_TITLE_IDEAL,
  SEO_TITLE_MAX,
  seoCharStatus,
} from "@/lib/landing-pages/seo";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import {
  TEMPLATES,
  templatePreviewSrc,
  type LpTemplate,
} from "@/lib/landing-pages/templates";
import { effectiveOrder, labelOf } from "@/lib/landing-pages/section-order";
import { extractYouTubeId } from "@/lib/landing-pages/youtube";
import { showAccessDeniedToast, showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { type EditorSectionMeta, EditorSectionNav } from "./editor-section-nav";
import { Field, inputCls } from "./fields";
import { PalettePicker } from "./palette-picker";
import { SocialsInput } from "./socials-input";
import type { LpForm } from "./use-lp-form";
import {
  AREAS_THUMBS,
  DOR_THUMBS,
  EQUIPE_THUMBS,
  ETAPAS_THUMBS,
  HERO_THUMBS,
  SOBRE_THUMBS,
  SOLUCAO_THUMBS,
  VariantPicker,
} from "./variant-picker";

const HERO_OPTIONS = [
  { id: "centered", label: "Centralizado", thumb: HERO_THUMBS.centered },
  { id: "split", label: "Split 50/50", thumb: HERO_THUMBS.split },
  { id: "video", label: "Vídeo + Foto", thumb: HERO_THUMBS.video },
  { id: "stats", label: "Com métricas", thumb: HERO_THUMBS.stats },
];
const DOR_OPTIONS = [
  { id: "comImagem", label: "Com imagem", thumb: DOR_THUMBS.comImagem },
  { id: "soCards", label: "Só cards", thumb: DOR_THUMBS.soCards },
];
const SOLUCAO_OPTIONS = [
  { id: "comImagem", label: "Com imagem", thumb: SOLUCAO_THUMBS.comImagem },
  { id: "soCards", label: "Só cards", thumb: SOLUCAO_THUMBS.soCards },
  { id: "destaque", label: "Com destaque", thumb: SOLUCAO_THUMBS.destaque },
];
const SOBRE_OPTIONS = [
  { id: "fotoLista", label: "Foto + lista", thumb: SOBRE_THUMBS.fotoLista },
  { id: "overlay", label: "Imagem + overlay", thumb: SOBRE_THUMBS.overlay },
  { id: "duasColunas", label: "Duas colunas", thumb: SOBRE_THUMBS.duasColunas },
];
const AREAS_OPTIONS = [
  { id: "grid", label: "Grade", thumb: AREAS_THUMBS.grid },
  { id: "lista", label: "Lista", thumb: AREAS_THUMBS.lista },
];
const ETAPAS_OPTIONS = [
  { id: "numerado", label: "Numerado", thumb: ETAPAS_THUMBS.numerado },
  { id: "timeline", label: "Linha do tempo", thumb: ETAPAS_THUMBS.timeline },
];
const EQUIPE_OPTIONS = [
  {
    id: "splitAlternado",
    label: "Split alternado",
    thumb: EQUIPE_THUMBS.splitAlternado,
  },
  {
    id: "retratoElegante",
    label: "Retrato elegante",
    thumb: EQUIPE_THUMBS.retratoElegante,
  },
];

const HERO_VARIANT_LABELS: Record<string, string> = {
  centered: "Centralizado",
  split: "Split 50/50",
  video: "Vídeo + Foto",
  stats: "Com métricas",
};
const DOR_VARIANT_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
};
const SOLUCAO_VARIANT_LABELS: Record<string, string> = {
  comImagem: "Com imagem",
  soCards: "Só cards",
  destaque: "Com destaque",
};
const SOBRE_VARIANT_LABELS: Record<string, string> = {
  fotoLista: "Foto + lista",
  overlay: "Imagem + overlay",
  duasColunas: "Duas colunas",
};
const AREAS_VARIANT_LABELS: Record<string, string> = {
  grid: "Grade",
  lista: "Lista",
};
const ETAPAS_VARIANT_LABELS: Record<string, string> = {
  numerado: "Numerado",
  timeline: "Linha do tempo",
};
const EQUIPE_VARIANT_LABELS: Record<string, string> = {
  splitAlternado: "Split alternado",
  retratoElegante: "Retrato elegante",
};

type DetailSectionId =
  | "modelo"
  | "aparencia"
  | "seo"
  | "hero"
  | "dor"
  | "solucao"
  | "sobre"
  | "equipe"
  | "areas"
  | "etapas"
  | "faq"
  | "ctaFinal"
  | "footer";

// Passos do tutorial guiado: seguem a ordem dos accordeons, do topo ao rodapé.
// A "Identidade e marca" fica de fora — já vem preenchida pelo cadastro. Cada
// passo tem um texto curto e SEM jargão (o público são advogados, não devs).
const TOUR: { id: string; target: string; title: string; hint: string }[] = [
  {
    id: "hero",
    target: "sec-hero",
    title: "Topo da página",
    hint: "Escolha o estilo do topo.",
  },
  {
    id: "dor",
    target: "sec-dor",
    title: "Dores do cliente",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "solucao",
    target: "sec-solucao",
    title: "Como você ajuda",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "sobre",
    target: "sec-sobre",
    title: "Sobre o escritório",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "equipe",
    target: "sec-equipe",
    title: "Equipe",
    hint: "Adicione as fotos e escolha o fundo (claro ou escuro).",
  },
  {
    id: "areas",
    target: "sec-areas",
    title: "Áreas de atuação",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "etapas",
    target: "sec-etapas",
    title: "Como funciona",
    hint: "Escolha o estilo e o fundo (claro ou escuro).",
  },
  {
    id: "faq",
    target: "sec-faq",
    title: "Perguntas frequentes",
    hint: "Escolha o fundo (claro ou escuro).",
  },
  {
    id: "ctaFinal",
    target: "sec-ctaFinal",
    title: "Convite final",
    hint: "Escolha o fundo (claro ou escuro).",
  },
  {
    id: "footer",
    target: "sec-footer",
    title: "Contato e rodapé",
    hint: "Confira seus contatos e endereço.",
  },
];

export function Editor({
  form,
  slug,
  officeSubdomain,
  name,
  status: initialStatus,
  startTour,
}: {
  form: LpForm;
  slug: string;
  officeSubdomain: string;
  name: string;
  status?: "draft" | "published";
  startTour?: boolean;
}) {
  const router = useRouter();
  const { office, set, theme, autoTheme, layout } = form;
  const previewRef = useRef<HTMLIFrameElement>(null);
  const isLgUp = useIsLgUp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("preview");
  const showEditPanel = isLgUp ? sidebarOpen : mobileTab === "edit";
  const showPreviewPanel = isLgUp || mobileTab === "preview";
  const [viewport, setViewport] = useState<Viewport>("desktop");
  // Modal de personalização do formulário do popup de lead.
  const [builderOpen, setBuilderOpen] = useState(false);
  // Modo "Mudar sequência": colapsa tudo e mostra só as seções arrastáveis.
  const [reorderMode, setReorderMode] = useState(false);
  // Modo de edição: Simples (padrão — só o essencial) x Avançado (tudo).
  const [advanced, setAdvanced] = useState(false);
  // No modo Simples: qual card do bento está aberto (null = mostra o bento).
  const [simplePanel, setSimplePanel] = useState<SimplePanel | null>(null);
  // Grade de paletas aberta? (o botão "Trocar" fica na linha das bolinhas).
  const [palOpen, setPalOpen] = useState(false);
  // Mestre-detalhe: ao clicar numa seção fixa, suas configs abrem num painel à
  // direita (null = lista; senão, a key da seção em detalhe).
  const [detailSection, setDetailSection] = useState<DetailSectionId | null>(
    null,
  );
  // Tutorial guiado: índice do passo atual (null = tutorial desligado).
  const [tourStep, setTourStep] = useState<number | null>(startTour ? 0 : null);
  const tourActive = tourStep !== null;
  // Mostra o editor completo no modo Avançado OU durante o tutorial (que guia
  // por todas as seções). Ao terminar o tutorial, volta ao modo Simples.
  const fullEditor = advanced || tourActive;
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [savedSchema, setSavedSchema] = useState<object>(() => form.schema);
  const dirty = form.schema !== savedSchema;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">(
    initialStatus ?? "draft",
  );
  const [publishState, setPublishState] = useState<"idle" | "saving" | "error">(
    "idle",
  );

  const needsVideo = layout.hero === "video";
  const needsMetrics = layout.hero === "stats";
  // Só o Hero centralizado mostra os mini-cards de destaque (ícone + texto).
  const needsCards = layout.hero === "centered";

  const heroOptions = useMemo(
    () =>
      form.videoId
        ? HERO_OPTIONS
        : HERO_OPTIONS.filter((o) => o.id !== "video"),
    [form.videoId],
  );

  const equipeVariant =
    layout.equipe ??
    (office.lawyers.length <= 3 ? "splitAlternado" : "retratoElegante");

  // Detecta qual template está aplicado no momento (match parcial por variantes).
  const currentTemplateId = useMemo(() => {
    return TEMPLATES.find(
      (t) =>
        t.layout.hero === layout.hero &&
        t.layout.dor === layout.dor &&
        t.layout.solucao === layout.solucao &&
        t.layout.sobre === layout.sobre &&
        t.layout.areas === layout.areas &&
        t.layout.etapas === layout.etapas,
    )?.id;
  }, [layout]);

  const editorSections = useMemo((): EditorSectionMeta[] => {
    const items: EditorSectionMeta[] = [
      {
        id: "modelo",
        label: "Modelo",
        previewTarget: "sec-hero",
      },
      {
        id: "aparencia",
        label: "Aparência",
        previewTarget: "sec-hero",
      },
      {
        id: "seo",
        label: "SEO",
        previewTarget: "sec-hero",
      },
      {
        id: "hero",
        label: "Topo",
        previewTarget: "sec-hero",
        variantLabel: HERO_VARIANT_LABELS[layout.hero],
      },
      {
        id: "dor",
        label: "Dores",
        previewTarget: "sec-dor",
        variantLabel: DOR_VARIANT_LABELS[layout.dor],
      },
      {
        id: "solucao",
        label: "Solução",
        previewTarget: "sec-solucao",
        variantLabel: SOLUCAO_VARIANT_LABELS[layout.solucao],
      },
      {
        id: "sobre",
        label: "Sobre",
        previewTarget: "sec-sobre",
        variantLabel: SOBRE_VARIANT_LABELS[layout.sobre],
      },
      {
        id: "equipe",
        label: "Equipe",
        previewTarget: "sec-equipe",
        variantLabel:
          office.lawyers.length >= 2
            ? EQUIPE_VARIANT_LABELS[equipeVariant]
            : undefined,
      },
      {
        id: "areas",
        label: "Áreas",
        previewTarget: "sec-areas",
        variantLabel: AREAS_VARIANT_LABELS[layout.areas],
      },
      {
        id: "etapas",
        label: "Etapas",
        previewTarget: "sec-etapas",
        variantLabel: ETAPAS_VARIANT_LABELS[layout.etapas],
      },
      {
        id: "faq",
        label: "FAQ",
        previewTarget: "sec-faq",
      },
      {
        id: "ctaFinal",
        label: "CTA final",
        previewTarget: "sec-ctaFinal",
      },
      {
        id: "footer",
        label: "Rodapé",
        previewTarget: "sec-footer",
      },
    ];
    return items;
  }, [layout, office.lawyers.length, equipeVariant]);

  function goToDetailSection(id: DetailSectionId) {
    setDetailSection(id);
    if (!isLgUp) setMobileTab("edit");
    const target =
      editorSections.find((s) => s.id === id)?.previewTarget ?? `sec-${id}`;
    scrollToSection(target);
  }

  // Ao abrir um accordeon, rola o preview até a seção correspondente. O preview
  // vive dentro de um <iframe>, então busca-se a seção no documento do iframe.
  function scrollToSection(id: string) {
    requestAnimationFrame(() => {
      previewRef.current?.contentDocument
        ?.getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Vai para um passo do tutorial: abre o accordeon certo, rola o painel até ele
  // e rola o preview até a seção. Tudo conduzido pelos botões da barra-guia.
  function goToStep(idx: number) {
    const clamped = Math.max(0, Math.min(TOUR.length - 1, idx));
    setTourStep(clamped);
    const step = TOUR[clamped];
    scrollToSection(step.target);
    requestAnimationFrame(() => {
      document
        .getElementById(`acc-${step.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // Props de controle que cada accordeon recebe durante o tutorial: só o passo
  // atual fica aberto; clicar no cabeçalho de outro pula o tutorial para ele.
  function tourProps(id: string) {
    if (tourStep === null) return {};
    return {
      open: TOUR[tourStep]?.id === id,
      onOpenChange: () => {
        const idx = TOUR.findIndex((t) => t.id === id);
        if (idx >= 0) goToStep(idx);
      },
    };
  }

  // Limpa o ?novo=1 da URL (o tutorial guiado foi removido por enquanto).
  useEffect(() => {
    if (!startTour) return;
    window.history.replaceState(null, "", window.location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTour]);

  async function salvar() {
    setSaveState("saving");
    const stored: StoredLp = {
      slug,
      officeSubdomain,
      name: office.name || name,
      tema: form.tema,
      status,
      schema: form.schema,
    };
    try {
      const res = await saveLpAction(stored);
      if ("error" in res) {
        if (isAccessDeniedError(res.error)) {
          showAccessDeniedToast();
        } else {
          showLpMessageError(res.error);
        }
        setSaveState("error");
        return;
      }
      setSavedSchema(form.schema);
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  async function publicar() {
    setPublishState("saving");
    try {
      const res = await publishLpAction(slug);
      if ("error" in res) {
        if (isAccessDeniedError(res.error)) showAccessDeniedToast();
        else showLpMessageError(res.error);
        setPublishState("error");
        return;
      }
      setStatus("published");
      setPublishState("idle");
    } catch {
      setPublishState("error");
    }
  }

  async function despublicar() {
    setPublishState("saving");
    try {
      const res = await unpublishLpAction(slug);
      if (!res.ok) {
        if (res.error && isAccessDeniedError(res.error)) showAccessDeniedToast();
        else if (res.error) showLpMessageError(res.error);
        setPublishState("error");
        return;
      }
      setStatus("draft");
      setPublishState("idle");
    } catch {
      setPublishState("error");
    }
  }

  // Avisa o navegador antes de fechar/recarregar com alterações pendentes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  return (
    <div className="app-ui flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden bg-muted/40 lg:flex-row">
      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Alterações não salvas"
        description="Você tem alterações que ainda não foram salvas. Sair mesmo assim?"
        confirmLabel="Sair sem salvar"
        variant="destructive"
        onConfirm={() => router.push("/")}
      />
      {/* ====== Painel esquerdo: editor ====== */}
      <aside
        className={cn(
          "flex w-full max-w-full min-w-0 shrink-0 flex-col overflow-hidden border-border bg-card lg:w-[480px] lg:max-w-[480px] lg:flex-none lg:border-r",
          showEditPanel ? "min-h-0 flex-1" : "hidden",
        )}
      >
        <header className="relative flex shrink-0 items-center border-b border-border px-5 py-4">
          {detailSection || (!fullEditor && simplePanel !== null) ? (
            <button
              type="button"
              onClick={() => {
                if (detailSection) setDetailSection(null);
                else setSimplePanel(null);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
          ) : (
            <Link
              href="/"
              onClick={(e) => {
                if (!dirty) return;
                e.preventDefault();
                setLeaveOpen(true);
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <ChevronLeft size={16} /> Galeria
            </Link>
          )}
          <span className="pointer-events-none absolute inset-x-0 truncate px-20 text-center text-sm font-semibold text-foreground sm:px-28">
            {detailSection
              ? (editorSections.find((s) => s.id === detailSection)?.label ??
                (office.name || name))
              : office.name || name}
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            title="Fechar editor"
            className="ml-auto hidden shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground lg:block"
          >
            <LeftPanelClose size={18} />
          </button>
        </header>

        {detailSection ? (
          <EditorSectionNav
            sections={editorSections}
            current={detailSection}
            onChange={(id) => goToDetailSection(id as DetailSectionId)}
          />
        ) : null}

        <div className="min-h-0 min-w-0 max-w-full flex-1 space-y-3 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
          {detailSection ? (
            <div className="min-w-0 max-w-full space-y-3">
              {detailSection === "modelo" && (
                <ModeloPicker form={form} currentId={currentTemplateId} />
              )}
              {detailSection === "seo" && <SeoPanel form={form} />}
              {detailSection === "hero" && (
                <>
                  <ToneToggle
                    value={layout.tones.hero ?? "light"}
                    onChange={(t) => form.setTone("hero", t)}
                  />
                  <VariantPicker
                    options={heroOptions}
                    value={layout.hero}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        hero: id as Layout["hero"],
                      }))
                    }
                  />
                  <SectionImageInput form={form} sectionKey="hero" />
                  <Accordion title="Textos" flush>
                    <HeroTexts form={form} />
                  </Accordion>
                  {needsVideo ? (
                    <Accordion title="Vídeo" flush>
                      <Field
                        label="Link do vídeo do YouTube"
                        hint="Cole o link do YouTube — a gente identifica o vídeo."
                      >
                        <div className="flex items-center gap-2">
                          <Movie
                            size={16}
                            className="shrink-0 text-slate-400"
                          />
                          <input
                            aria-label="Link do vídeo do YouTube"
                            className={inputCls}
                            value={form.videoId}
                            onChange={(e) =>
                              form.setVideoId(extractYouTubeId(e.target.value))
                            }
                            placeholder="Cole o link (ex: youtube.com/watch?v=...)"
                          />
                        </div>
                      </Field>
                    </Accordion>
                  ) : null}
                  {needsMetrics ? (
                    <Accordion title="Métricas" flush>
                      <MetricsInput form={form} />
                    </Accordion>
                  ) : null}
                  {needsCards ? (
                    <Accordion title="Mini-cards" flush>
                      <HeroFeaturesInput form={form} />
                    </Accordion>
                  ) : null}
                </>
              )}
              {detailSection === "aparencia" && (
                <>
                  {/* Cantos: cards e botões juntos, lado a lado conceitualmente */}
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-700">
                      Cantos (arredondado ou quadrado)
                    </p>
                    <div className="space-y-2">
                      <Segmented
                        label="Cards"
                        value={office.cardRadius ?? "square"}
                        onChange={(v) => set("cardRadius", v)}
                        options={CORNER_OPTIONS}
                      />
                      <Segmented
                        label="Botões"
                        value={office.buttons?.radius ?? "square"}
                        onChange={(v) => form.setButtonField("radius", v)}
                        options={CORNER_OPTIONS}
                      />
                    </div>
                  </div>

                  {/* Ação dos botões + (se for popup) personalização do formulário */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <Field
                      label="O que acontece ao clicar num botão"
                      hint="Vale para todos os botões de chamada da página."
                    >
                      <select
                        aria-label="Ação dos botões"
                        className={inputCls}
                        value={office.buttons?.action ?? "popup"}
                        onChange={(e) =>
                          form.setButtonField("action", e.target.value)
                        }
                      >
                        <option value="popup">Abrir popup de formulário</option>
                        <option value="whatsapp">Abrir WhatsApp</option>
                        <option value="link">Abrir link personalizado</option>
                      </select>
                    </Field>
                    {(office.buttons?.action ?? "popup") === "link" ? (
                      <Field
                        label="Link do botão"
                        hint="Endereço completo (ex.: https://...)."
                      >
                        <input
                          className={inputCls}
                          value={office.buttons?.link ?? ""}
                          onChange={(e) =>
                            form.setButtonField("link", e.target.value)
                          }
                          placeholder="https://..."
                          inputMode="url"
                        />
                      </Field>
                    ) : (office.buttons?.action ?? "popup") === "whatsapp" ? (
                      <p className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs leading-relaxed text-slate-500">
                        Os botões abrem o WhatsApp informado no{" "}
                        <strong>Rodapé</strong>.
                      </p>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        <p className="text-xs leading-relaxed text-slate-500">
                          Abre um formulário que termina sempre com{" "}
                          <strong>nome</strong> e <strong>telefone</strong>.
                          Você pode adicionar perguntas antes desse passo.
                        </p>
                        <button
                          type="button"
                          onClick={() => setBuilderOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-ui px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ui-dark"
                        >
                          <Tune size={15} /> Personalizar formulário
                          {office.buttons?.popup?.questions.length
                            ? ` (${office.buttons.popup.questions.length})`
                            : ""}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tipografia: fontes de títulos e textos da LP */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-sm font-medium text-slate-700">
                      Tipografia
                    </p>
                    <Field
                      label="Títulos e destaques"
                      hint="Fonte usada nos títulos de seção e manchetes."
                    >
                      <select
                        aria-label="Fonte dos títulos"
                        className={inputCls}
                        value={office.fonts?.heading ?? ""}
                        onChange={(e) =>
                          form.setFont("heading", e.target.value)
                        }
                      >
                        <option value="">Padrão do site</option>
                        {HEADING_FONTS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label="Textos e parágrafos"
                      hint="Fonte usada nos parágrafos e textos de apoio."
                    >
                      <select
                        aria-label="Fonte dos textos"
                        className={inputCls}
                        value={office.fonts?.body ?? ""}
                        onChange={(e) => form.setFont("body", e.target.value)}
                      >
                        <option value="">Padrão do site</option>
                        {BODY_FONTS.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  {/* Tags de rastreamento: Google Analytics, Meta Pixel, GTM etc. */}
                  <div className="border-t border-slate-100 pt-3">
                    <Accordion title="Tags de rastreamento" flush>
                      <p className="text-xs leading-relaxed text-slate-500">
                        Cole aqui os scripts do Google Analytics, Meta Pixel,
                        Google Tag Manager ou qualquer outro código de tracking.
                      </p>
                      <Field
                        label="Código no <head>"
                        hint="Carrega antes do conteúdo — ideal para GTM e gtag."
                      >
                        <AutoTextarea
                          aria-label="Tags no head"
                          className={`${inputCls} min-h-[80px] resize-y font-mono text-xs`}
                          value={office.tags?.head ?? ""}
                          onChange={(e) => form.setTag("head", e.target.value)}
                          placeholder={
                            "<script>\n  // seu código aqui\n</script>"
                          }
                        />
                      </Field>
                      <Field
                        label="Código no <body>"
                        hint="Logo após a abertura do body — para noscript do GTM."
                      >
                        <AutoTextarea
                          aria-label="Tags no body"
                          className={`${inputCls} min-h-[80px] resize-y font-mono text-xs`}
                          value={office.tags?.body ?? ""}
                          onChange={(e) => form.setTag("body", e.target.value)}
                          placeholder={"<noscript>...</noscript>"}
                        />
                      </Field>
                    </Accordion>
                  </div>
                </>
              )}
              {detailSection === "dor" && (
                <>
                  <ToneToggle
                    value={layout.tones.dor}
                    onChange={(t) => form.setTone("dor", t)}
                  />
                  <VariantPicker
                    options={DOR_OPTIONS}
                    value={layout.dor}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        dor: id as Layout["dor"],
                      }))
                    }
                  />
                  <SectionImageInput form={form} sectionKey="dor" />
                  <Accordion title="Textos" flush>
                    <DorTexts form={form} />
                  </Accordion>
                  <Accordion title="Cards" flush>
                    <DorCards form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "solucao" && (
                <>
                  <ToneToggle
                    value={layout.tones.solucao}
                    onChange={(t) => form.setTone("solucao", t)}
                  />
                  <VariantPicker
                    options={SOLUCAO_OPTIONS}
                    value={layout.solucao}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        solucao: id as Layout["solucao"],
                      }))
                    }
                  />
                  <SectionImageInput form={form} sectionKey="solucao" />
                  <Accordion title="Textos" flush>
                    <SolucaoTexts form={form} />
                  </Accordion>
                  <Accordion title="Cards" flush>
                    <SolucaoCards form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "sobre" && (
                <>
                  <ToneToggle
                    value={layout.tones.sobre}
                    onChange={(t) => form.setTone("sobre", t)}
                  />
                  <VariantPicker
                    options={SOBRE_OPTIONS}
                    value={layout.sobre}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        sobre: id as Layout["sobre"],
                      }))
                    }
                  />
                  <SectionImageInput form={form} sectionKey="sobre" />
                  <Accordion title="Texto" flush>
                    <Field
                      label="Apresentação"
                      hint="Pule linha para separar em parágrafos."
                    >
                      <AutoTextarea
                        aria-label="Texto do Sobre"
                        className={`${inputCls} min-h-[140px] resize-y`}
                        value={office.about}
                        onChange={(e) => set("about", e.target.value)}
                        placeholder="Atuamos com dedicação na defesa de quem trabalha..."
                      />
                    </Field>
                  </Accordion>
                  {layout.sobre === "fotoLista" ||
                  layout.sobre === "duasColunas" ? (
                    <Accordion title="Diferenciais" flush>
                      <DiferenciaisInput form={form} />
                    </Accordion>
                  ) : null}
                </>
              )}
              {detailSection === "equipe" && (
                <>
                  {office.lawyers.length >= 2 ? (
                    <>
                      <ToneToggle
                        value={layout.tones.equipe}
                        onChange={(t) => form.setTone("equipe", t)}
                      />
                      <VariantPicker
                        options={EQUIPE_OPTIONS}
                        value={equipeVariant}
                        onChange={(id) =>
                          form.setLayout((l) => ({
                            ...l,
                            equipe: id as EquipeVariant,
                          }))
                        }
                      />
                    </>
                  ) : null}
                  <LawyerPhotosInput form={form} />
                </>
              )}
              {detailSection === "areas" && (
                <>
                  <ToneToggle
                    value={layout.tones.areas}
                    onChange={(t) => form.setTone("areas", t)}
                  />
                  <VariantPicker
                    options={AREAS_OPTIONS}
                    value={layout.areas}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        areas: id as Layout["areas"],
                      }))
                    }
                  />
                  <Accordion title="Textos" flush>
                    <AreasTexts form={form} />
                  </Accordion>
                  <Accordion title="Cards" flush>
                    <AreasCards form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "etapas" && (
                <>
                  <ToneToggle
                    value={layout.tones.etapas}
                    onChange={(t) => form.setTone("etapas", t)}
                  />
                  <VariantPicker
                    options={ETAPAS_OPTIONS}
                    value={layout.etapas}
                    onChange={(id) =>
                      form.setLayout((l) => ({
                        ...l,
                        etapas: id as Layout["etapas"],
                      }))
                    }
                  />
                  <Accordion title="Textos" flush>
                    <EtapasTexts form={form} />
                  </Accordion>
                  <Accordion title="Passos" flush>
                    <EtapasCards form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "faq" && (
                <>
                  <ToneToggle
                    value={layout.tones.faq}
                    onChange={(t) => form.setTone("faq", t)}
                  />
                  <Accordion title="Textos" flush>
                    <FaqTexts form={form} />
                  </Accordion>
                  <Accordion title="Perguntas" flush>
                    <FaqPerguntas form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "ctaFinal" && (
                <>
                  <ToneToggle
                    value={layout.tones.ctaFinal}
                    onChange={(t) => form.setTone("ctaFinal", t)}
                  />
                  <Accordion title="Textos" flush>
                    <CtaFinalTexts form={form} />
                  </Accordion>
                </>
              )}
              {detailSection === "footer" && (
                <AccordionListContext.Provider value={true}>
                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                    <Accordion
                      title="Contato"
                      flush
                      domId="acc-ftr-contato"
                      defaultOpen
                    >
                      <Field label="WhatsApp">
                        <input
                          className={inputCls}
                          value={office.whatsappDisplay}
                          onChange={(e) => form.onPhone(e.target.value)}
                          placeholder="(67) 99999-9999"
                          inputMode="tel"
                        />
                      </Field>
                      <Field label="E-mail">
                        <input
                          className={inputCls}
                          value={office.email}
                          onChange={(e) => set("email", e.target.value)}
                          inputMode="email"
                        />
                      </Field>
                      {(office.extraContacts ?? []).map((c, i) => (
                        <div
                          key={i}
                          className="space-y-2 rounded-lg border border-slate-200 p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                              Contato {i + 2}
                            </span>
                            <button
                              type="button"
                              aria-label="Remover contato"
                              onClick={() => form.removeContact(i)}
                              className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                            >
                              <Close size={14} />
                            </button>
                          </div>
                          <input
                            aria-label={`WhatsApp ${i + 2}`}
                            className={inputCls}
                            value={c.whatsappDisplay}
                            onChange={(e) =>
                              form.setContactPhone(i, e.target.value)
                            }
                            placeholder="(67) 99999-9999"
                            inputMode="tel"
                          />
                          <input
                            aria-label={`E-mail ${i + 2}`}
                            className={inputCls}
                            value={c.email}
                            onChange={(e) =>
                              form.setContactEmail(i, e.target.value)
                            }
                            placeholder="contato@escritorio.com"
                            inputMode="email"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={form.addContact}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
                      >
                        <Add size={16} /> Adicionar telefone/e-mail
                      </button>
                    </Accordion>

                    <Accordion title="Endereço" flush domId="acc-ftr-endereco">
                      <Field
                        label="Endereço (opcional)"
                        hint="Rua, número, bairro, cidade, CEP. Pode usar várias linhas."
                      >
                        <AutoTextarea
                          aria-label="Endereço"
                          className={`${inputCls} min-h-[68px] resize-y`}
                          value={office.address}
                          onChange={(e) => set("address", e.target.value)}
                          placeholder={
                            "Rua Quinze de Novembro, 697, Centro\nPiraju - SP, CEP 18800-023"
                          }
                        />
                      </Field>
                      <Field label="Cidade / Estado (opcional)">
                        <input
                          className={inputCls}
                          value={office.city}
                          onChange={(e) => set("city", e.target.value)}
                          placeholder="Cidade / Estado"
                        />
                      </Field>
                      <Field
                        label="Link do Google Maps (opcional)"
                        hint="Se preenchido, gera o link 'Ver mais' abaixo do endereço."
                      >
                        <input
                          className={inputCls}
                          value={office.mapsUrl}
                          onChange={(e) => set("mapsUrl", e.target.value)}
                          placeholder="https://maps.app.goo.gl/..."
                          inputMode="url"
                        />
                      </Field>
                      {(office.extraAddresses ?? []).map((a, i) => (
                        <div
                          key={i}
                          className="space-y-2 rounded-lg border border-slate-200 p-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">
                              Endereço {i + 2}
                            </span>
                            <button
                              type="button"
                              aria-label="Remover endereço"
                              onClick={() => form.removeAddress(i)}
                              className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                            >
                              <Close size={14} />
                            </button>
                          </div>
                          <AutoTextarea
                            aria-label={`Endereço ${i + 2}`}
                            className={`${inputCls} min-h-[56px] resize-y`}
                            value={a.address}
                            onChange={(e) =>
                              form.setAddressField(i, "address", e.target.value)
                            }
                            placeholder="Rua, número, bairro, CEP"
                          />
                          <input
                            aria-label={`Cidade / Estado ${i + 2}`}
                            className={inputCls}
                            value={a.city}
                            onChange={(e) =>
                              form.setAddressField(i, "city", e.target.value)
                            }
                            placeholder="Cidade / Estado"
                          />
                          <input
                            aria-label={`Link do Google Maps ${i + 2}`}
                            className={inputCls}
                            value={a.mapsUrl}
                            onChange={(e) =>
                              form.setAddressField(i, "mapsUrl", e.target.value)
                            }
                            placeholder="https://maps.app.goo.gl/... (opcional)"
                            inputMode="url"
                          />
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={form.addAddress}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
                      >
                        <Add size={16} /> Adicionar endereço
                      </button>
                    </Accordion>

                    <Accordion
                      title="Redes sociais"
                      flush
                      domId="acc-ftr-redes"
                    >
                      <SocialsInput
                        socials={office.socials}
                        onChange={form.setSocialField}
                        onAdd={form.addSocial}
                        onRemove={form.removeSocial}
                      />
                    </Accordion>

                    <Accordion
                      title="Política de privacidade"
                      flush
                      domId="acc-ftr-politica"
                    >
                      <Field
                        label="Texto da política"
                        hint="Aparece como link no rodapé. Se deixar vazio, usamos um modelo LGPD padrão (com o nome e e-mail do escritório)."
                      >
                        <AutoTextarea
                          aria-label="Política de privacidade"
                          className={`${inputCls} min-h-[120px]`}
                          value={office.privacyPolicy ?? ""}
                          onChange={(e) => set("privacyPolicy", e.target.value)}
                          placeholder="Cole aqui a política de privacidade do escritório, ou deixe vazio para usar o modelo padrão."
                        />
                      </Field>
                    </Accordion>
                  </div>
                </AccordionListContext.Provider>
              )}
            </div>
          ) : reorderMode ? (
            <ReorderPanel form={form} onClose={() => setReorderMode(false)} />
          ) : (
            <>
              {!tourActive && simplePanel === null ? (
                <ModeToggle advanced={advanced} onChange={setAdvanced} />
              ) : null}
              {simplePanel === null ? (
                <button
                  type="button"
                  onClick={() => setReorderMode(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-ui-hover hover:text-slate-900"
                >
                  <SwapVert size={18} /> Mudar sequência das seções
                </button>
              ) : null}
              {/* Identidade e marca — só no Simples (no Avançado já está coberto). */}
              {simplePanel === "identidade" ? (
                <Accordion
                  title="Identidade e marca"
                  defaultOpen
                  flush
                  bare={!fullEditor}
                  target="sec-hero"
                  onOpen={scrollToSection}
                  domId="acc-identidade"
                  icon={<Storefront size={22} />}
                  subtitle="Logo e cores do escritório"
                  {...tourProps("identidade")}
                >
                  {/* Tema é só referência do foco da LP — não é editável aqui (mudar o
                texto não regenera a página), então fica fixo e não como input. */}
                  {form.tema ? (
                    <Field
                      label="Tema da página"
                      hint="Referência do foco da página (definido na criação)."
                    >
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                        {form.tema}
                      </p>
                    </Field>
                  ) : null}

                  {/* Logo — galeria sob demanda */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                      Logo
                    </p>
                    <LazyImageSlot
                      src={office.logoSrc}
                      label="Logo do escritório"
                      onChange={form.setLogoUrl}
                      onClear={() => form.setLogoUrl("")}
                    />
                    {office.logoSrc && autoTheme ? (
                      <p className="text-xs text-emerald-600">
                        <Palette size={13} className="inline" /> Cores extraídas
                        da logo
                      </p>
                    ) : null}
                  </div>

                  {/* Cores da marca */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                        Cores da marca
                      </p>
                      <button
                        type="button"
                        onClick={form.resetTheme}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-700"
                      >
                        <Undo size={13} /> Padrão
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex gap-1.5">
                        {[
                          theme.brand,
                          theme.brandDark,
                          theme.accent,
                          theme.accentSoft,
                          theme.cream,
                        ].map((c) => (
                          <span
                            key={c}
                            className="h-6 w-6 rounded-full border border-slate-200"
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPalOpen((v) => !v)}
                        aria-expanded={palOpen}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-ui-hover"
                      >
                        {palOpen ? "Fechar" : "Trocar"}
                        <KeyboardArrowDown
                          size={14}
                          className={`transition-transform ${palOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    <PalettePicker
                      value={theme}
                      onPick={form.applyPalette}
                      open={palOpen}
                      className="pt-1"
                    />
                  </div>
                </Accordion>
              ) : null}

              {fullEditor ? (
                <>
                  <AccordionListContext.Provider value={true}>
                    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                      {/* Modelo: preset de layout (variantes + tones) pré-definido. */}
                      <Accordion
                        title="Modelo da página"
                        flush
                        domId="acc-modelo"
                        icon={<GridView size={22} />}
                        subtitle="Combinação de layouts pré-definida"
                        open={false}
                        onOpenChange={() => goToDetailSection("modelo")}
                      />

                      {/* Aparência e botões — estilo da LP (cantos) e o que o botão faz ao
              ser clicado. Separado da Identidade para não misturar marca com
              comportamento. */}
                      <Accordion
                        title="Aparência e botões"
                        flush
                        domId="acc-aparencia"
                        icon={<Tune size={22} />}
                        subtitle="Cantos, tipografia e o que os botões fazem"
                        open={false}
                        onOpenChange={() => goToDetailSection("aparencia")}
                      />

                      {/* SEO: meta tags para Google, compartilhamento e tracking. */}
                      <Accordion
                        title="SEO e meta tags"
                        flush
                        domId="acc-seo"
                        icon={<Search size={22} />}
                        subtitle="Título, descrição e indexação nos buscadores"
                        open={false}
                        onOpenChange={() => goToDetailSection("seo")}
                      />

                      {/* Topo da página — abre as configs num painel à direita */}
                      <Accordion
                        title="Topo da página"
                        target="sec-hero"
                        onOpen={scrollToSection}
                        domId="acc-hero"
                        icon={<Web size={22} />}
                        subtitle="O topo da página — primeira impressão"
                        open={false}
                        onOpenChange={() => goToDetailSection("hero")}
                      />

                      {/* Dores */}
                      <Accordion
                        title="Dores do cliente"
                        target="sec-dor"
                        onOpen={scrollToSection}
                        domId="acc-dor"
                        icon={<SentimentDissatisfied size={22} />}
                        subtitle="Os problemas que você resolve"
                        open={false}
                        onOpenChange={() => goToDetailSection("dor")}
                      />

                      {/* Como ajudamos (Solução) */}
                      <Accordion
                        title="Como você ajuda"
                        target="sec-solucao"
                        onOpen={scrollToSection}
                        domId="acc-solucao"
                        icon={<Lightbulb size={22} />}
                        subtitle="Como o seu trabalho resolve"
                        open={false}
                        onOpenChange={() => goToDetailSection("solucao")}
                      />

                      {/* Sobre o escritório */}
                      <Accordion
                        title="Sobre o escritório"
                        target="sec-sobre"
                        onOpen={scrollToSection}
                        domId="acc-sobre"
                        icon={<Badge size={22} />}
                        subtitle="Sua apresentação"
                        open={false}
                        onOpenChange={() => goToDetailSection("sobre")}
                      />

                      {/* Equipe */}
                      <Accordion
                        title="Equipe"
                        target="sec-equipe"
                        onOpen={scrollToSection}
                        domId="acc-equipe"
                        icon={<Groups size={22} />}
                        subtitle="Fotos dos advogados/sócios"
                        toggle={{
                          on: !layout.hidden?.equipe,
                          onChange: (on) =>
                            form.setSectionHidden("equipe", !on),
                        }}
                        open={false}
                        onOpenChange={() => goToDetailSection("equipe")}
                      />

                      {/* Áreas de atuação */}
                      <Accordion
                        title="Áreas de atuação"
                        target="sec-areas"
                        onOpen={scrollToSection}
                        domId="acc-areas"
                        icon={<Gavel size={22} />}
                        subtitle="As áreas em que você atende"
                        toggle={{
                          on: !layout.hidden?.areas,
                          onChange: (on) => form.setSectionHidden("areas", !on),
                        }}
                        open={false}
                        onOpenChange={() => goToDetailSection("areas")}
                      />

                      {/* Etapas do atendimento */}
                      <Accordion
                        title="Como funciona"
                        target="sec-etapas"
                        onOpen={scrollToSection}
                        domId="acc-etapas"
                        icon={<FormatListNumbered size={22} />}
                        subtitle="O passo a passo do atendimento"
                        toggle={{
                          on: !layout.hidden?.etapas,
                          onChange: (on) =>
                            form.setSectionHidden("etapas", !on),
                        }}
                        open={false}
                        onOpenChange={() => goToDetailSection("etapas")}
                      />

                      {/* Seções personalizadas (criadas pelo usuário) */}
                      {form.customSections.map((sec) => (
                        <CustomSectionEditor
                          key={sec.id}
                          form={form}
                          section={sec}
                          onScroll={() =>
                            scrollToSection(`sec-custom-${sec.id}`)
                          }
                        />
                      ))}

                      {/* FAQ */}
                      <Accordion
                        title="Perguntas frequentes"
                        target="sec-faq"
                        onOpen={scrollToSection}
                        domId="acc-faq"
                        icon={<Help size={22} />}
                        subtitle="Dúvidas frequentes dos clientes"
                        toggle={{
                          on: !layout.hidden?.faq,
                          onChange: (on) => form.setSectionHidden("faq", !on),
                        }}
                        open={false}
                        onOpenChange={() => goToDetailSection("faq")}
                      />

                      {/* CTA final */}
                      <Accordion
                        title="Convite final"
                        target="sec-ctaFinal"
                        onOpen={scrollToSection}
                        domId="acc-ctaFinal"
                        icon={<Campaign size={22} />}
                        subtitle="O convite final para contato"
                        toggle={{
                          on: !layout.hidden?.ctaFinal,
                          onChange: (on) =>
                            form.setSectionHidden("ctaFinal", !on),
                        }}
                        open={false}
                        onOpenChange={() => goToDetailSection("ctaFinal")}
                      />

                      {/* Contato e rodapé */}
                      <Accordion
                        title="Contato e rodapé"
                        target="sec-footer"
                        onOpen={scrollToSection}
                        domId="acc-footer"
                        icon={<ContactPage size={22} />}
                        subtitle="Contato, endereço e redes"
                        open={false}
                        onOpenChange={() => goToDetailSection("footer")}
                      />
                    </div>
                  </AccordionListContext.Provider>
                  <AddSectionButton onAdd={form.addCustomSection} />
                </>
              ) : simplePanel === null ? (
                <SimpleBento
                  form={form}
                  onOpen={(p) => {
                    if (p === "contato") goToDetailSection("footer");
                    else setSimplePanel(p);
                  }}
                />
              ) : simplePanel === "imagens" ? (
                <ImagensSimples form={form} />
              ) : null}
            </>
          )}
        </div>

        {/* Barra fixa de salvar + publicar no rodapé do editor */}
        <div className="shrink-0 space-y-2 border-t border-border bg-card px-5 py-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={salvar}
              disabled={saveState === "saving"}
              className="flex-1 rounded-lg bg-ui px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ui-dark disabled:opacity-50"
            >
              {saveState === "saving"
                ? "Salvando…"
                : saveState === "error"
                  ? "Erro — tentar de novo"
                  : dirty
                    ? "Salvar"
                    : "Salvo"}
            </button>

            {status === "published" ? (
              <button
                type="button"
                onClick={despublicar}
                disabled={publishState === "saving"}
                title="Retirar do ar"
                className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                {publishState === "saving" ? (
                  <ProgressActivity size={16} className="animate-spin" />
                ) : (
                  <CloudOff size={16} />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={publicar}
                disabled={publishState === "saving" || dirty}
                title={dirty ? "Salve antes de publicar" : "Publicar"}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {publishState === "saving" ? (
                  <ProgressActivity size={16} className="animate-spin" />
                ) : (
                  "Publicar"
                )}
              </button>
            )}
          </div>

          {status === "published" ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle size={13} />
              Publicado em{" "}
              <a
                href={publicLpUrl(officeSubdomain, slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                {publicLpDisplayHost(officeSubdomain, slug)}
              </a>
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Draft size={13} />
              Rascunho — não está no ar
            </p>
          )}
        </div>
      </aside>

      {/* ====== Painel direito: preview ====== */}
      <main
        className={cn(
          "flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden",
          !showPreviewPanel && "hidden",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {isLgUp && !sidebarOpen ? (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                title="Abrir editor"
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
              >
                <LeftPanelOpen size={18} />
              </button>
            ) : null}
            <span className="hidden items-center gap-1 truncate text-xs font-medium text-amber-600 sm:inline-flex">
              <Visibility size={13} /> Prévia — ainda não está no ar
            </span>
          </div>

          {/* Seletor de viewport: desktop (padrão) · tablet · mobile */}
          <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
            {(
              [
                { id: "desktop", label: "Desktop", Icon: DesktopWindows },
                { id: "tablet", label: "Tablet", Icon: Tablet },
                { id: "mobile", label: "Mobile", Icon: Devices },
              ] as const
            ).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewport(id)}
                aria-pressed={viewport === id}
                title={label}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  viewport === id
                    ? "bg-ui-soft text-ui"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <DevicePreview ref={previewRef} mode={viewport}>
            <LandingPreview schema={form.schema} />
          </DevicePreview>
        </div>
      </main>

      {!isLgUp ? (
        <nav
          aria-label="Alternar painel do editor"
          className="flex shrink-0 border-t border-border bg-background supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))] lg:hidden"
        >
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            aria-pressed={mobileTab === "edit"}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
              mobileTab === "edit"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Tune size={20} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            aria-pressed={mobileTab === "preview"}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
              mobileTab === "preview"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Visibility size={20} />
            Prévia
          </button>
        </nav>
      ) : null}

      {builderOpen ? (
        <PopupBuilder form={form} onClose={() => setBuilderOpen(false)} />
      ) : null}
    </div>
  );
}

// Accordeon de uma seção do editor: cabeçalho clicável + corpo. Ao ABRIR,
// chama onOpen(target) para o preview rolar até a seção correspondente.
// Quando true (via Provider), os accordeons renderizam "flush" para formar uma
// lista única (um card com divisórias), como no modo Simples.
const AccordionListContext = createContext(false);

function Accordion({
  title,
  defaultOpen,
  target,
  onOpen,
  children,
  domId,
  open: openProp,
  onOpenChange,
  toggle: sectionToggle,
  icon,
  subtitle,
  flush,
  bare,
}: {
  title: string;
  defaultOpen?: boolean;
  target?: string;
  onOpen?: (target: string) => void;
  children?: React.ReactNode;
  domId?: string;
  // Quando `open` é fornecido, o accordeon é CONTROLADO (usado pelo tutorial);
  // sem ele, gerencia o próprio estado.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Selo Ativo/Oculta clicável (só nas seções não obrigatórias).
  toggle?: { on: boolean; onChange: (on: boolean) => void };
  icon?: React.ReactNode; // ícone no quadrado à esquerda
  subtitle?: string; // descrição curta abaixo do título
  flush?: boolean; // sem bordas laterais (só linha em cima/baixo)
  bare?: boolean; // sem cabeçalho: renderiza só o conteúdo (já "aberto")
}) {
  const [internalOpen, setInternalOpen] = useState(!!defaultOpen);
  // Dentro de uma lista (Provider), renderiza "flush" (sem borda/cantos próprios).
  const listed = useContext(AccordionListContext);
  const asFlush = flush || listed;
  // Modo "bare": quando é a única coisa na tela (painel do Simples aberto), não
  // precisa de cabeçalho clicável — mostra direto o conteúdo.
  if (bare) {
    return <div className="space-y-3">{children}</div>;
  }
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const off = sectionToggle ? !sectionToggle.on : false;
  function toggle() {
    const opening = !open;
    if (!controlled) setInternalOpen(opening);
    onOpenChange?.(opening);
    if (opening && target) onOpen?.(target);
  }
  // O cabeçalho inteiro expande/recolhe: um <button> absoluto cobre a linha,
  // atrás do conteúdo (que é pointer-events-none); só o selo Ativo/Oculta fica
  // clicável por cima. sem overflow-hidden: dropdowns internos precisam vazar.
  return (
    <div
      id={domId}
      className={`scroll-mt-3 ${
        asFlush ? "" : "rounded-xl border border-slate-200"
      }`}
    >
      <div
        className={`group relative flex items-center gap-3 px-4 py-3 transition ${
          open ? "bg-white" : "bg-white hover:bg-slate-50"
        } ${asFlush ? "" : open ? "rounded-t-xl" : "rounded-xl"}`}
      >
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={open ? "Recolher seção" : "Expandir seção"}
          className="absolute inset-0 rounded-[inherit]"
        />
        {icon ? (
          <span
            className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              off
                ? "bg-slate-100 text-slate-300"
                : open
                  ? "bg-ui-soft text-ui"
                  : "bg-slate-100 text-slate-400 group-hover:bg-ui-soft group-hover:text-ui"
            }`}
          >
            {icon}
          </span>
        ) : null}
        <div className="pointer-events-none relative z-10 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`truncate text-sm font-semibold ${
                off ? "text-slate-400" : open ? "text-ui" : "text-slate-800"
              }`}
            >
              {title}
            </span>
            {sectionToggle ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sectionToggle.onChange(!sectionToggle.on);
                }}
                className={`pointer-events-auto shrink-0 rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                  sectionToggle.on
                    ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {sectionToggle.on ? "Ativo" : "Oculta"}
              </button>
            ) : null}
          </div>
          {subtitle ? (
            <p
              className={`truncate text-xs ${off ? "text-slate-300" : "text-ui-gray"}`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <KeyboardArrowDown
          size={18}
          className={`pointer-events-none relative z-10 shrink-0 transition-transform ${open ? "rotate-180 text-ui" : "text-slate-400"}`}
        />
      </div>
      {open ? (
        <div className="space-y-3 border-t border-slate-100 px-4 py-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}

// Sub-seção recolhível dentro de um accordeon (ex.: grupos do Rodapé). Mantém
// o painel enxuto: o usuário abre só o grupo que vai mexer. Mesmo estilo/cores.
function _SubGroup({
  icon,
  title,
  defaultOpen,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div
      className={`rounded-lg border ${open ? "border-ui/40" : "border-slate-200"}`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
          open ? "rounded-t-lg bg-ui-soft" : "rounded-lg hover:bg-ui-hover"
        }`}
      >
        {icon ?? null}
        <span
          className={`flex-1 text-sm font-medium ${open ? "text-ui" : "text-slate-700"}`}
        >
          {title}
        </span>
        <KeyboardArrowDown
          size={16}
          className={`shrink-0 transition-transform ${open ? "rotate-180 text-ui" : "text-slate-400"}`}
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3">
          {children}
        </div>
      ) : null}
    </div>
  );
}

// Toggle claro/escuro do fundo de uma seção.
function ToneToggle({
  value,
  onChange,
}: {
  value: Tone;
  onChange: (t: Tone) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="text-sm font-medium text-slate-700">Fundo da seção</span>
      <div className="inline-flex w-full shrink-0 gap-0.5 self-end rounded-lg border border-slate-200 p-0.5 sm:w-auto">
        {(["light", "dark"] as Tone[]).map((t) => {
          const active = value === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                active
                  ? "bg-ui-soft text-ui"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {t === "light" ? "Claro" : "Escuro"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Controle segmentado genérico (estilo "abas") — usado nos cantos de cards e
// botões. Opcional: rótulo acima.
const CORNER_OPTIONS = [
  { id: "rounded", label: "Arredondado" },
  { id: "square", label: "Quadrado" },
] as const;

function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { id: T; label: string }[];
  label?: string;
}) {
  return (
    <div>
      {label ? <p className="mb-1.5 text-xs text-slate-400">{label}</p> : null}
      <div className="flex w-full gap-1 rounded-xl border border-slate-200 p-1">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                active
                  ? "bg-ui-soft text-ui"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {active ? <Check size={15} /> : null}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Seletor de ícone: botão com o ícone atual que abre uma grade com todos os
// ícones disponíveis (lib/icons). Usado nos mini-cards do Hero centralizado.
function IconForKey({ iconKey, size }: { iconKey: string; size: number }) {
  switch (iconKey) {
    case "shield-check":
      return <VerifiedUser size={size} />;
    case "clock":
      return <Schedule size={size} />;
    case "handshake":
      return <Handshake size={size} />;
    case "file-x":
    case "file-text":
      return <Description size={size} />;
    case "timer":
      return <Timer size={size} />;
    case "alert":
      return <Warning size={size} />;
    case "search":
      return <Search size={size} />;
    case "calculator":
      return <Calculate size={size} />;
    case "gavel":
      return <Gavel size={size} />;
    case "bell":
      return <NotificationsActive size={size} />;
    case "banknote":
      return <Payments size={size} />;
    case "trophy":
      return <Trophy size={size} />;
    case "laptop":
      return <LaptopMac size={size} />;
    case "star":
      return <Star size={size} />;
    case "user-check":
      return <HowToReg size={size} />;
    case "shield-x":
      return <GppBad size={size} />;
    case "scale":
      return <Balance size={size} />;
    case "heart-pulse":
      return <MonitorHeart size={size} />;
    case "home":
      return <Home size={size} />;
    case "briefcase":
      return <Work size={size} />;
    case "users":
      return <Groups size={size} />;
    case "landmark":
      return <AccountBalance size={size} />;
    case "badge-dollar":
      return <Paid size={size} />;
    case "hand-coins":
      return <Savings size={size} />;
    case "stethoscope":
      return <Stethoscope size={size} />;
    case "baby":
      return <ChildCare size={size} />;
    case "building":
      return <Apartment size={size} />;
    case "car":
      return <DirectionsCar size={size} />;
    case "scroll":
      return <Article size={size} />;
    default:
      return <Balance size={size} />;
  }
}

function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-label="Escolher ícone"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[38px] w-[38px] items-center justify-center rounded-lg border border-slate-300 bg-white text-ui transition hover:bg-ui-hover"
      >
        <IconForKey iconKey={value} size={18} />
      </button>
      {open ? (
        <>
          {/* clique fora fecha */}
          <div
            aria-hidden
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div className="absolute left-0 top-[42px] z-30 grid max-h-56 w-56 grid-cols-6 gap-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            {ICON_KEYS.map((key) => {
              const active = key === value;
              return (
                <button
                  key={key}
                  type="button"
                  title={key}
                  aria-label={key}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    active
                      ? "bg-ui-soft text-ui"
                      : "text-slate-500 hover:bg-ui-hover hover:text-slate-800"
                  }`}
                >
                  <IconForKey iconKey={key} size={17} />
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

// Editor dos mini-cards de destaque do Hero centralizado (ícone + texto). São
// opcionais: deixe vazio para ocultar; sem nenhum, a faixa de cards some. Máx. 3.
const MAX_HERO_FEATURES = 3;
function HeroFeaturesInput({ form }: { form: LpForm }) {
  const features = form.office.heroFeatures ?? [];
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        Cards de destaque
      </p>
      <p className="mb-2 text-xs text-slate-400">
        Ícone + texto curto, exibidos abaixo do topo. Sem nenhum, a faixa não
        aparece. Até {MAX_HERO_FEATURES} cards.
      </p>
      <div className="space-y-2">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <IconPicker
              value={f.icon}
              onChange={(key) => form.setHeroFeature(i, "icon", key)}
            />
            <input
              aria-label={`Card ${i + 1} — texto`}
              className={inputCls}
              value={f.text}
              onChange={(e) => form.setHeroFeature(i, "text", e.target.value)}
              placeholder="Ex: Atendimento próximo"
            />
            <button
              type="button"
              aria-label="Remover card"
              onClick={() => form.removeHeroFeature(i)}
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {features.length < MAX_HERO_FEATURES ? (
        <button
          type="button"
          onClick={form.addHeroFeature}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar card
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_HERO_FEATURES} cards atingido.
        </p>
      )}
    </div>
  );
}

// Editor dos destaques do Hero "Com métricas" (ícone + texto). Lista dinâmica:
// X remove cada item; sem nenhum, a faixa não aparece. Máx. 3.
const MAX_METRICS = 3;
function MetricsInput({ form }: { form: LpForm }) {
  const metrics = form.office.metrics;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Destaques</p>
      <p className="mb-2 text-xs text-slate-400">
        Ícone + texto curto. Sem nenhum, a faixa não aparece. Até {MAX_METRICS}.
      </p>
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <IconPicker
              value={m.icon}
              onChange={(key) => form.setMetric(i, "icon", key)}
            />
            <input
              aria-label={`Destaque ${i + 1} — texto`}
              className={inputCls}
              value={m.label}
              onChange={(e) => form.setMetric(i, "label", e.target.value)}
              placeholder="Ex: anos de atuação"
            />
            <button
              type="button"
              aria-label="Remover destaque"
              onClick={() => form.removeMetric(i)}
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {metrics.length < MAX_METRICS ? (
        <button
          type="button"
          onClick={form.addMetric}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar destaque
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_METRICS} destaques atingido.
        </p>
      )}
    </div>
  );
}

// Editor da lista de diferenciais da seção Sobre (variantes "Foto + lista" e
// "Duas colunas"). No máximo 4 itens; itens vazios são descartados ao renderizar.
const MAX_DIFERENCIAIS = 4;
function DiferenciaisInput({ form }: { form: LpForm }) {
  const difs = form.office.diferenciais;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        Diferenciais (lista)
      </p>
      <p className="mb-2 text-xs text-slate-400">
        Pontos fortes exibidos ao lado da foto. Até {MAX_DIFERENCIAIS} itens.
      </p>
      <div className="space-y-2">
        {difs.map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              aria-label={`Diferencial ${i + 1}`}
              className={inputCls}
              value={d}
              onChange={(e) => form.setDiferencial(i, e.target.value)}
              placeholder={`Diferencial ${i + 1}`}
            />
            <button
              type="button"
              aria-label="Remover diferencial"
              onClick={() => form.removeDiferencial(i)}
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {difs.length < MAX_DIFERENCIAIS ? (
        <button
          type="button"
          onClick={form.addDiferencial}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar diferencial
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_DIFERENCIAIS} diferenciais atingido.
        </p>
      )}
    </div>
  );
}

// Modal "Personalizar" — monta o formulário do popup de lead: perguntas (texto
// ou múltipla escolha) que aparecem ANTES do passo fixo de nome + telefone.
function PopupBuilder({
  form,
  onClose,
}: {
  form: LpForm;
  onClose: () => void;
}) {
  const questions = form.office.buttons?.popup?.questions ?? [];
  const update = (qs: PopupQuestion[]) => form.setPopupQuestions(qs);

  function addQ() {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `q-${Math.random().toString(36).slice(2)}`;
    update([...questions, { id, label: "", type: "text", options: [] }]);
  }
  function setField(i: number, patch: Partial<PopupQuestion>) {
    update(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function removeQ(i: number) {
    update(questions.filter((_, idx) => idx !== i));
  }
  function setOption(i: number, oi: number, v: string) {
    update(
      questions.map((q, idx) =>
        idx === i
          ? { ...q, options: q.options.map((o, k) => (k === oi ? v : o)) }
          : q,
      ),
    );
  }
  function addOption(i: number) {
    update(
      questions.map((q, idx) =>
        idx === i ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }
  function removeOption(i: number, oi: number) {
    update(
      questions.map((q, idx) =>
        idx === i ? { ...q, options: q.options.filter((_, k) => k !== oi) } : q,
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Personalizar formulário
            </h2>
            <p className="text-xs text-ui-gray">
              Perguntas antes do passo de nome e telefone
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {questions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-400">
              Nenhuma pergunta ainda. O popup abre direto no nome e telefone.
            </p>
          ) : null}

          {questions.map((q, i) => (
            <div
              key={q.id}
              className="space-y-3 rounded-lg border border-slate-200 p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                  Pergunta {i + 1}
                </span>
                <button
                  type="button"
                  aria-label="Remover pergunta"
                  onClick={() => removeQ(i)}
                  className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-red-600"
                >
                  <Delete size={14} />
                </button>
              </div>
              <Field
                label="Pergunta"
                hint="O que o visitante vê antes de responder."
              >
                <input
                  aria-label={`Pergunta ${i + 1}`}
                  className={inputCls}
                  value={q.label}
                  onChange={(e) => setField(i, { label: e.target.value })}
                  placeholder="Ex: Qual a sua situação hoje?"
                />
              </Field>
              <Field label="Tipo de resposta">
                <select
                  aria-label={`Tipo da pergunta ${i + 1}`}
                  className={inputCls}
                  value={q.type}
                  onChange={(e) =>
                    setField(i, {
                      type: e.target.value as PopupQuestion["type"],
                    })
                  }
                >
                  <option value="text">Resposta livre</option>
                  <option value="choice">Múltipla escolha</option>
                </select>
              </Field>
              {q.type === "choice" ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-slate-700">Opções</p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1.5">
                      <input
                        aria-label={`Opção ${oi + 1}`}
                        className={inputCls}
                        value={opt}
                        onChange={(e) => setOption(i, oi, e.target.value)}
                        placeholder={`Opção ${oi + 1}`}
                      />
                      <button
                        type="button"
                        aria-label="Remover opção"
                        onClick={() => removeOption(i, oi)}
                        className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                      >
                        <Close size={14} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(i)}
                    className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-1.5 text-xs font-medium text-ui transition hover:bg-ui-hover"
                  >
                    <Add size={13} /> Adicionar opção
                  </button>
                </div>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={addQ}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-ui-hover"
          >
            <Add size={16} /> Adicionar pergunta
          </button>

          {/* Passo final fixo */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 space-y-3">
            <div>
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                Passo final (fixo)
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Nome e telefone — sempre aparecem no fim.
              </p>
            </div>
            {/* Campo de e-mail opcional */}
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Campo de e-mail
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.office.buttons?.popup?.email;
                    form.setPopupEmail(
                      current?.enabled
                        ? undefined
                        : { enabled: true, required: false },
                    );
                  }}
                  className={`rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                    form.office.buttons?.popup?.email?.enabled
                      ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {form.office.buttons?.popup?.email?.enabled
                    ? "Ativo"
                    : "Inativo"}
                </button>
              </div>
              {form.office.buttons?.popup?.email?.enabled ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Preenchimento</span>
                  <div className="inline-flex gap-0.5 rounded-lg border border-slate-200 p-0.5">
                    {(
                      [
                        { id: false, label: "Opcional" },
                        { id: true, label: "Obrigatório" },
                      ] as const
                    ).map(({ id, label }) => {
                      const active =
                        (form.office.buttons?.popup?.email?.required ??
                          false) === id;
                      return (
                        <button
                          key={String(id)}
                          type="button"
                          onClick={() =>
                            form.setPopupEmail({ enabled: true, required: id })
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? "bg-ui-soft text-ui"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-ui px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ui-dark"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

// Linha fixa (não arrastável) na tela de reordenar — Hero/FAQ/Rodapé.
function FixedRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2.5">
      <Lock size={16} className="text-slate-300" />
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="ml-auto text-[0.7rem] uppercase tracking-wide text-slate-300">
        fixo
      </span>
    </div>
  );
}

// Tela "Mudar sequência": Hero/FAQ/Rodapé fixos; o meio é reordenável por
// arrastar (drag-drop HTML5). A nova ordem é salva em layout.order.
function ReorderPanel({
  form,
  onClose,
}: {
  form: LpForm;
  onClose: () => void;
}) {
  const order = effectiveOrder(form.layout, form.customSections);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  function drop(target: number) {
    if (dragIdx !== null && dragIdx !== target) {
      const next = [...order];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(target, 0, moved);
      form.setSectionOrder(next);
    }
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Sequência</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-lg bg-ui px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-ui-dark"
        >
          <Check size={14} /> Concluir
        </button>
      </div>
      <p className="text-xs text-ui-gray">
        Arraste para reordenar. Topo, Perguntas frequentes e Rodapé ficam fixos.
      </p>

      <FixedRow label="Topo da página" />
      {order.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={() => setDragIdx(i)}
          onDragOver={(e) => {
            e.preventDefault();
            setOverIdx(i);
          }}
          onDrop={() => drop(i)}
          onDragEnd={() => {
            setDragIdx(null);
            setOverIdx(null);
          }}
          className={`flex cursor-grab items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition active:cursor-grabbing ${
            overIdx === i && dragIdx !== null && dragIdx !== i
              ? "border-ui ring-1 ring-ui/30"
              : "border-slate-200"
          } ${dragIdx === i ? "opacity-40" : ""}`}
        >
          <DragIndicator size={18} className="text-slate-400" />
          <span className="truncate text-sm font-medium text-slate-700">
            {labelOf(item, form.customSections)}
          </span>
        </div>
      ))}
      <FixedRow label="Perguntas frequentes" />
      <FixedRow label="Contato e rodapé" />
    </div>
  );
}

// Enquadramento da foto (estilo foto de perfil): arraste a imagem para encaixar
// o rosto. Guarda o ponto focal em % (x/y), aplicado como background-position.
const clampPct = (n: number) => Math.max(0, Math.min(100, n));

function FocalPicker({
  src,
  value,
  onChange,
}: {
  src: string;
  value: { x: number; y: number };
  onChange: (v: { x: number; y: number }) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    sx: number;
    sy: number;
    fx: number;
    fy: number;
  } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, fx: value.x, fy: value.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const box = ref.current;
    if (!d || !box) return;
    const r = box.getBoundingClientRect();
    // Arrastar a imagem revela o lado oposto: puxar p/ baixo mostra o topo.
    const nx = clampPct(d.fx - ((e.clientX - d.sx) / r.width) * 100);
    const ny = clampPct(d.fy - ((e.clientY - d.sy) / r.height) * 100);
    onChange({ x: Math.round(nx), y: Math.round(ny) });
  }
  function onPointerUp() {
    drag.current = null;
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2">
      <div className="flex items-start gap-3">
        <div
          ref={ref}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative aspect-[3/4] w-28 shrink-0 cursor-move touch-none select-none overflow-hidden rounded-lg bg-lp-brand ring-1 ring-slate-300"
          style={{
            backgroundImage: `url('${src}')`,
            backgroundSize: "cover",
            backgroundPosition: `${value.x}% ${value.y}%`,
          }}
        >
          <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs text-slate-500">
            Arraste a foto para encaixar o rosto. O recorte vale para a página
            (topo, sobre e equipe).
          </p>
          <button
            type="button"
            onClick={() => onChange({ x: 50, y: 50 })}
            className="inline-flex items-center gap-1 text-xs text-slate-400 transition hover:text-slate-700"
          >
            <Undo size={13} /> Centralizar
          </button>
        </div>
      </div>
    </div>
  );
}

// Linha de um advogado: foto + nome/função + remover + "Melhorar foto".
// A melhoria (upscale + nitidez via sharp, sem IA generativa) preserva a pessoa
// pixel a pixel; mesmo assim mostramos antes/depois para o usuário aprovar.
function LawyerRow({
  form,
  lawyer,
  index,
}: {
  form: LpForm;
  lawyer: Lawyer;
  index: number;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImagemMelhorada | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [framing, setFraming] = useState(false);

  async function melhorar() {
    setLoading(true);
    setError(null);
    try {
      setResult(await melhorarImagem(lawyer.photo));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao melhorar a foto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white p-3">
      {/* Foto grande no topo, com X (remover) e ações flutuando */}
      <div className="relative min-w-0 max-w-full">
        <ZoomableImage
          src={lawyer.photo}
          alt={`advogado ${index + 1}`}
          className="h-[140px] w-full rounded-lg ring-1 ring-slate-200"
        />
        <button
          type="button"
          aria-label="Remover advogado"
          onClick={(e) => {
            e.stopPropagation();
            form.removeLawyerPhoto(index);
          }}
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <Close size={14} />
        </button>
        <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              melhorar();
            }}
            disabled={loading}
            title="Aumenta resolução e nitidez da foto, mantendo a pessoa"
            className="inline-flex items-center gap-1.5 rounded-lg bg-ui-soft/95 px-2.5 py-1.5 text-xs font-medium text-ui shadow-sm backdrop-blur transition hover:bg-ui-soft disabled:opacity-60"
          >
            {loading ? (
              <ProgressActivity size={14} className="animate-spin" />
            ) : (
              <WandStars size={14} />
            )}
            {loading ? "Melhorando…" : "Melhorar foto"}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFraming((v) => !v);
            }}
            aria-label="Enquadrar"
            title="Reposiciona a foto para o rosto não ser cortado"
            className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm backdrop-blur transition ${
              framing
                ? "bg-ui-soft/95 text-ui"
                : "bg-white/90 text-slate-600 hover:bg-white"
            }`}
          >
            <OpenWith size={16} />
          </button>
        </div>
      </div>

      {/* Campos: nome (destaque) + cargo (discreto) */}
      <div className="mt-3 flex flex-col gap-1.5">
        <input
          aria-label={`Nome do advogado ${index + 1}`}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.name}
          onChange={(e) => form.setLawyerField(index, "name", e.target.value)}
          placeholder="Nome do advogado"
        />
        <input
          aria-label={`Cargo do advogado ${index + 1}`}
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500 outline-none transition focus:border-ui focus:ring-2 focus:ring-ui/15"
          value={lawyer.role}
          onChange={(e) => form.setLawyerField(index, "role", e.target.value)}
          placeholder="Cargo e OAB (ex: Sócio · OAB/SP 000)"
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {framing ? (
        <div className="mt-2">
          <FocalPicker
            src={lawyer.photo}
            value={lawyer.focal ?? { x: 50, y: 50 }}
            onChange={(v) => form.setLawyerFocal(index, v)}
          />
        </div>
      ) : null}

      {/* Modal de comparação antes/depois em tamanho cheio */}
      {result ? (
        <ComparePhotoModal
          before={lawyer.photo}
          after={result.image}
          beforeDim={result.before}
          afterDim={result.after}
          onApply={() => {
            form.setLawyerPhoto(index, result.image);
            setResult(null);
          }}
          onDiscard={() => setResult(null)}
        />
      ) : null}
    </div>
  );
}

// Modal grande para comparar a foto atual com a melhorada, lado a lado e sem
// cortar (object-contain), para o usuário decidir com clareza.
function ComparePhotoModal({
  before,
  after,
  beforeDim,
  afterDim,
  onApply,
  onDiscard,
}: {
  before: string;
  after: string;
  beforeDim: { width: number; height: number };
  afterDim: { width: number; height: number };
  onApply: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onDiscard}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Comparar a foto
            </h2>
            <p className="text-xs text-ui-gray">
              Mesma pessoa, com mais nitidez e resolução:{" "}
              <strong>
                {beforeDim.width}×{beforeDim.height}
              </strong>{" "}
              →{" "}
              <strong className="text-ui">
                {afterDim.width}×{afterDim.height}
              </strong>
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onDiscard}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
          >
            <Close size={18} />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          <figure className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
              Atual · {beforeDim.width}×{beforeDim.height}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={before}
              alt="foto atual"
              className="max-h-[62vh] w-full rounded-lg bg-slate-100 object-contain ring-1 ring-slate-200"
            />
          </figure>
          <figure className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui">
              Melhorada · {afterDim.width}×{afterDim.height}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={after}
              alt="foto melhorada"
              className="max-h-[62vh] w-full rounded-lg bg-slate-100 object-contain ring-2 ring-ui"
            />
          </figure>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onDiscard}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
          >
            <Close size={15} /> Descartar
          </button>
          <button
            type="button"
            onClick={onApply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ui px-5 py-2 text-sm font-semibold text-white transition hover:bg-ui-dark"
          >
            <Check size={15} /> Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

// Upload dos advogados (foto + nome + função). 1 = solo; 2+ = seção Equipe.
function LawyerPhotosInput({ form }: { form: LpForm }) {
  const ref = useRef<HTMLInputElement>(null);
  const lawyers = form.office.lawyers;
  return (
    <div className="space-y-3">
      <input
        ref={ref}
        type="file"
        multiple
        aria-label="Enviar fotos dos advogados"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) form.onAddLawyerPhotos(e.target.files);
          e.target.value = "";
        }}
      />
      {lawyers.length > 0 ? (
        <div className="space-y-3">
          {lawyers.map((l, i) => (
            <LawyerRow key={i} form={form} lawyer={l} index={i} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-5 text-center text-xs text-slate-400">
          Nenhum advogado cadastrado.
        </p>
      )}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
      >
        <Add size={16} />
        {lawyers.length > 0 ? "Adicionar mais" : "Adicionar advogados"}
      </button>
    </div>
  );
}

// Upload de imagem de seção — abre galeria sob demanda (clique).
function SectionImageInput({
  form,
  sectionKey,
  label,
}: {
  form: LpForm;
  sectionKey: SectionImageKey;
  label?: string;
}) {
  const src = form.office.sectionImages[sectionKey];
  const [loadingIA, setLoadingIA] = useState(false);

  async function iaEscolhe() {
    setLoadingIA(true);
    try {
      const res = await fetch("/api/imagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: form.tema, sectionKey, current: src }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string };
      if (data.url) form.setSectionImageUrl(sectionKey, data.url);
    } catch {
      /* mantém imagem atual */
    } finally {
      setLoadingIA(false);
    }
  }

  return (
    <LazyImageSlot
      src={src}
      label={label ?? "Imagem da seção"}
      onChange={(url) => form.setSectionImageUrl(sectionKey, url)}
      onClear={() => form.clearSectionImage(sectionKey)}
      extraActions={
        <button
          type="button"
          onClick={iaEscolhe}
          disabled={loadingIA}
          title="Busca uma imagem relacionada ao tema da página"
          className="inline-flex items-center gap-1.5 rounded-lg border border-ui/30 bg-ui-soft px-2.5 py-1.5 text-xs font-medium text-ui transition hover:bg-ui/15 disabled:opacity-60"
        >
          {loadingIA ? (
            <ProgressActivity size={14} className="animate-spin" />
          ) : (
            <WandStars size={14} />
          )}
          {loadingIA ? "Buscando…" : "IA escolhe"}
        </button>
      }
    />
  );
}

// Botão "Adicionar seção": ao clicar, abre a escolha entre seção com CARDS ou
// com TEXTO (como o "Sobre"). Depois de criada, o tom claro/escuro é ajustado
// dentro do próprio accordeon da seção.
function AddSectionButton({
  onAdd,
}: {
  onAdd: (kind: CustomSection["kind"]) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  if (!choosing) {
    return (
      <button
        type="button"
        onClick={() => setChoosing(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-ui-hover"
      >
        <Add size={16} /> Adicionar seção
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-2 text-xs font-medium text-slate-600">
        Que tipo de seção você quer?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onAdd("cards");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <GridView size={20} className="text-slate-500" />
          Com cards
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("texto");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <Notes size={20} className="text-slate-500" />
          Com texto
        </button>
      </div>
      <button
        type="button"
        onClick={() => setChoosing(false)}
        className="mt-2 w-full text-center text-xs text-slate-400 transition hover:text-slate-600"
      >
        Cancelar
      </button>
    </div>
  );
}

// Editor de uma seção personalizada: título, conteúdo (cards ou texto) e o
// toggle claro/escuro. O lápis fica no próprio accordeon, com botão de remover.
/* ===== Edição dos TEXTOS das seções (copy gerada pela IA) =====
   Os campos abaixo escrevem na copy via form.editCopy. Ficam no topo de cada
   accordeon de seção: editar o texto é o que o usuário mais quer fazer. */

function EyebrowField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label="Linha de cima (menor)" hint="Texto curto acima do título.">
      <input
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Como ajudamos"
      />
    </Field>
  );
}

function HeadlineFields({
  headline,
  onPart,
}: {
  headline: { pre: string; em: string; post: string };
  onPart: (part: "pre" | "em" | "post", v: string) => void;
}) {
  return (
    <Field
      label="Título principal"
      hint="O trecho do meio aparece na cor da marca (destaque)."
    >
      <div className="space-y-1.5">
        <input
          className={inputCls}
          value={headline.pre}
          onChange={(e) => onPart("pre", e.target.value)}
          placeholder="Início da frase"
        />
        <input
          className={inputCls}
          value={headline.em}
          onChange={(e) => onPart("em", e.target.value)}
          placeholder="Trecho em destaque (cor da marca)"
        />
        <input
          className={inputCls}
          value={headline.post}
          onChange={(e) => onPart("post", e.target.value)}
          placeholder="Final (opcional)"
        />
      </div>
    </Field>
  );
}

// Lista de pares (título + texto) — usada por cards, etapas e perguntas.
function PairList({
  title,
  items,
  phA,
  phB,
  multilineB = true,
  onChange,
  onAdd,
  onRemove,
  addLabel = "Adicionar",
  minItems = 0,
}: {
  title: string;
  items: { a: string; b: string }[];
  phA: string;
  phB: string;
  multilineB?: boolean;
  onChange: (i: number, which: "a" | "b", v: string) => void;
  onAdd?: () => void;
  onRemove?: (i: number) => void;
  addLabel?: string;
  minItems?: number;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="space-y-2 rounded-lg border border-slate-200 p-2.5"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {phA} {i + 1}
                </span>
                {onRemove && items.length > minItems ? (
                  <button
                    type="button"
                    aria-label="Remover"
                    onClick={() => onRemove(i)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Close size={14} />
                  </button>
                ) : null}
              </div>
              <input
                className={inputCls}
                value={it.a}
                onChange={(e) => onChange(i, "a", e.target.value)}
                placeholder={phA}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">{phB}</p>
              {multilineB ? (
                <AutoTextarea
                  className={`${inputCls} min-h-[56px] resize-y`}
                  value={it.b}
                  onChange={(e) => onChange(i, "b", e.target.value)}
                  placeholder={phB}
                />
              ) : (
                <input
                  className={inputCls}
                  value={it.b}
                  onChange={(e) => onChange(i, "b", e.target.value)}
                  placeholder={phB}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
        >
          <Add size={16} /> {addLabel}
        </button>
      ) : null}
    </div>
  );
}

function HeroTexts({ form }: { form: LpForm }) {
  const h = form.copy.hero;
  return (
    <>
      <EyebrowField
        value={h.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.hero.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={h.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.hero.headline[p] = v;
          })
        }
      />
      <Field label="Subtítulo" hint="Frase abaixo do título principal.">
        <AutoTextarea
          className={`${inputCls} min-h-[70px] resize-y`}
          value={h.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.hero.sub = e.target.value;
            })
          }
          placeholder="Uma ou duas frases que falam com o cliente."
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Botão principal">
          <input
            aria-label="Texto do botão principal"
            className={inputCls}
            value={h.ctaPrimary ?? CTA_PRIMARY}
            onChange={(e) =>
              form.editCopy((c) => {
                c.hero.ctaPrimary = e.target.value;
              })
            }
          />
        </Field>
        <Field label="Botão secundário">
          <input
            aria-label="Texto do botão secundário"
            className={inputCls}
            value={h.ctaSecondary ?? CTA_SECONDARY}
            onChange={(e) =>
              form.editCopy((c) => {
                c.hero.ctaSecondary = e.target.value;
              })
            }
          />
        </Field>
      </div>
    </>
  );
}

function DorTexts({ form }: { form: LpForm }) {
  const d = form.copy.dor;
  return (
    <>
      <EyebrowField
        value={d.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.dor.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={d.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.dor.headline[p] = v;
          })
        }
      />
      <Field label="Introdução" hint="Parágrafo de abertura da seção.">
        <AutoTextarea
          aria-label="Introdução"
          className={`${inputCls} min-h-[70px] resize-y`}
          value={d.intro}
          onChange={(e) =>
            form.editCopy((c) => {
              c.dor.intro = e.target.value;
            })
          }
        />
      </Field>
    </>
  );
}

function DorCards({ form }: { form: LpForm }) {
  const d = form.copy.dor;
  return (
    <PairList
      title=""
      items={d.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Título do problema"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.dor.cards[i].title = v;
          else c.dor.cards[i].text = v;
        })
      }
    />
  );
}

function SolucaoTexts({ form }: { form: LpForm }) {
  const s = form.copy.solucao;
  return (
    <>
      <EyebrowField
        value={s.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.solucao.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={s.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.solucao.headline[p] = v;
          })
        }
      />
      <Field label="Subtítulo">
        <AutoTextarea
          className={`${inputCls} min-h-[60px] resize-y`}
          aria-label="Subtítulo"
          value={s.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.solucao.sub = e.target.value;
            })
          }
        />
      </Field>
    </>
  );
}

function SolucaoCards({ form }: { form: LpForm }) {
  const s = form.copy.solucao;
  return (
    <PairList
      title=""
      items={s.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Título"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.solucao.cards[i].title = v;
          else c.solucao.cards[i].text = v;
        })
      }
    />
  );
}

function AreasTexts({ form }: { form: LpForm }) {
  const a = form.copy.areas;
  return (
    <>
      <EyebrowField
        value={a.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.areas.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={a.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.areas.headline[p] = v;
          })
        }
      />
      <Field label="Subtítulo">
        <AutoTextarea
          className={`${inputCls} min-h-[60px] resize-y`}
          aria-label="Subtítulo"
          value={a.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.areas.sub = e.target.value;
            })
          }
        />
      </Field>
      <Field label="Texto do botão da seção">
        <input
          aria-label="Texto do botão da seção"
          className={inputCls}
          value={a.cta ?? AREAS_CTA_FALLBACK}
          onChange={(e) =>
            form.editCopy((c) => {
              c.areas.cta = e.target.value;
            })
          }
        />
      </Field>
    </>
  );
}

function AreasCards({ form }: { form: LpForm }) {
  const a = form.copy.areas;
  return (
    <PairList
      title=""
      items={a.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Nome da área"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.areas.cards[i].title = v;
          else c.areas.cards[i].text = v;
        })
      }
    />
  );
}

function EtapasTexts({ form }: { form: LpForm }) {
  const e = form.copy.etapas ?? GENERIC_ETAPAS;
  return (
    <>
      <EyebrowField
        value={e.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
            c.etapas.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={e.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
            c.etapas.headline[p] = v;
          })
        }
      />
    </>
  );
}

function EtapasCards({ form }: { form: LpForm }) {
  const e = form.copy.etapas ?? GENERIC_ETAPAS;
  return (
    <PairList
      title=""
      items={e.steps.map((s) => ({ a: s.title, b: s.text }))}
      phA="Nome do passo"
      phB="O que acontece"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
          if (w === "a") c.etapas.steps[i].title = v;
          else c.etapas.steps[i].text = v;
        })
      }
    />
  );
}

function FaqTexts({ form }: { form: LpForm }) {
  const f = form.copy.faq;
  return (
    <>
      <EyebrowField
        value={f.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.faq.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={f.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.faq.headline[p] = v;
          })
        }
      />
    </>
  );
}

function FaqPerguntas({ form }: { form: LpForm }) {
  const f = form.copy.faq;
  return (
    <PairList
      title=""
      items={f.items.map((it) => ({ a: it.q, b: it.a }))}
      phA="Pergunta"
      phB="Resposta"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.faq.items[i].q = v;
          else c.faq.items[i].a = v;
        })
      }
      onAdd={() =>
        form.editCopy((c) => {
          c.faq.items.push({ q: "", a: "" });
        })
      }
      onRemove={(i) =>
        form.editCopy((c) => {
          c.faq.items.splice(i, 1);
        })
      }
      addLabel="Adicionar pergunta"
      minItems={3}
    />
  );
}

function CtaFinalTexts({ form }: { form: LpForm }) {
  const cf = form.copy.ctaFinal;
  return (
    <>
      <HeadlineFields
        headline={cf.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.ctaFinal.headline[p] = v;
          })
        }
      />
      <Field label="Subtítulo">
        <AutoTextarea
          className={`${inputCls} min-h-[60px] resize-y`}
          aria-label="Subtítulo"
          value={cf.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.ctaFinal.sub = e.target.value;
            })
          }
        />
      </Field>
      <Field label="Texto do botão">
        <input
          aria-label="Texto do botão"
          className={inputCls}
          value={cf.cta}
          onChange={(e) =>
            form.editCopy((c) => {
              c.ctaFinal.cta = e.target.value;
            })
          }
        />
      </Field>
    </>
  );
}

// Cards do bento do modo Simples: cada um abre o editor daquele item.
type SimplePanel = "identidade" | "imagens" | "contato";

// Lista compacta do modo Simples: um card com 3 linhas (cores, imagens,
// contato), cada uma com ícone colorido + resumo de status, que abre a seção.
function SimpleBento({
  form,
  onOpen,
}: {
  form: LpForm;
  onOpen: (p: SimplePanel) => void;
}) {
  const { office } = form;
  const imgs = (["hero", "sobre", "dor", "solucao"] as const)
    .map((k) => office.sectionImages[k])
    .filter(Boolean);
  const contatoFilled = [
    !!office.whatsappDisplay.trim(),
    !!office.email.trim(),
    !!(office.address.trim() || office.extraAddresses?.length),
    (office.socials ?? []).some((s) => s.url.trim()),
  ].filter(Boolean).length;

  const rows: {
    key: SimplePanel;
    icon: React.ReactNode;
    title: string;
    resumo: string;
    alerta: boolean;
  }[] = [
    {
      key: "identidade",
      icon: <Palette size={22} />,
      title: "Logo e cores",
      resumo: office.logoSrc ? "Logo configurada" : "Sem logo",
      alerta: false,
    },
    {
      key: "imagens",
      icon: <Image size={22} />,
      title: "Imagens da página",
      resumo: imgs.length
        ? `${imgs.length} ${imgs.length === 1 ? "imagem ativa" : "imagens ativas"}`
        : "Nenhuma imagem ainda",
      alerta: imgs.length === 0,
    },
    {
      key: "contato",
      icon: <ContactPage size={22} />,
      title: "Contato e rodapé",
      resumo: `${contatoFilled} de 4 itens preenchidos`,
      alerta: contatoFilled < 4,
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {rows.map((r, i) => (
        <button
          key={r.key}
          type="button"
          onClick={() => onOpen(r.key)}
          className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
            i < rows.length - 1 ? "border-b border-slate-100" : ""
          }`}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 transition group-hover:bg-ui-soft group-hover:text-ui">
            {r.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-slate-800">
              {r.title}
            </span>
            <span
              className={`block text-xs ${r.alerta ? "text-amber-600" : "text-slate-400"}`}
            >
              {r.resumo}
            </span>
          </span>
          <ChevronRight size={18} className="shrink-0 text-slate-300" />
        </button>
      ))}
    </div>
  );
}

// Alternador Simples x Avançado (topo do painel). Simples = só o essencial.
function ModeToggle({
  advanced,
  onChange,
}: {
  advanced: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <div className="inline-flex w-full gap-0.5 rounded-lg border border-slate-200 p-0.5">
        {[
          { v: false, label: "Simples" },
          { v: true, label: "Avançado" },
        ].map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.v)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              advanced === o.v
                ? "bg-ui-soft text-ui"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {advanced
          ? "Tudo: textos, layout, cores, imagens, seções e popup."
          : "O essencial: cores e logo, imagens e contato. Mude para Avançado para editar textos e layout."}
      </p>
    </div>
  );
}

// Modo Simples: agrupa as trocas de imagem das seções (e fotos dos advogados)
// num único accordeon, sem expor layout/variações.
function ImagensSimples({ form }: { form: LpForm }) {
  return (
    <Accordion
      title="Imagens da página"
      defaultOpen
      bare
      icon={<Image size={22} />}
      subtitle="Trocar as fotos das seções"
    >
      {/* Fotos dos advogados — primeiro */}
      <div className="space-y-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Fotos dos advogados
        </p>
        <LawyerPhotosInput form={form} />
      </div>

      {/* Imagens das seções — depois */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
          Imagens da página
        </p>
        <SectionImageInput form={form} sectionKey="hero" label="Foto do topo" />
        <SectionImageInput
          form={form}
          sectionKey="sobre"
          label="Foto do Sobre"
        />
        <SectionImageInput
          form={form}
          sectionKey="dor"
          label="Foto das Dores"
        />
        <SectionImageInput
          form={form}
          sectionKey="solucao"
          label="Foto de Como você ajuda"
        />
      </div>
    </Accordion>
  );
}

function CustomSectionEditor({
  form,
  section,
  onScroll,
}: {
  form: LpForm;
  section: CustomSection;
  onScroll: () => void;
}) {
  const titulo = section.title.trim() || "Nova seção";
  const tipo = section.kind === "cards" ? "cards" : "texto";
  return (
    <Accordion
      title={titulo}
      domId={`acc-custom-${section.id}`}
      onOpen={onScroll}
      target={`sec-custom-${section.id}`}
      icon={tipo === "cards" ? <Dashboard size={22} /> : <Notes size={22} />}
      subtitle={`Seção personalizada · ${tipo === "cards" ? "com cards" : "com texto"}`}
    >
      <Field label="Título de cima (opcional)">
        <input
          className={inputCls}
          value={section.eyebrow}
          onChange={(e) =>
            form.setCustomField(section.id, "eyebrow", e.target.value)
          }
          placeholder="Ex: Nosso diferencial"
        />
      </Field>
      <Field label="Título">
        <input
          className={inputCls}
          value={section.title}
          onChange={(e) =>
            form.setCustomField(section.id, "title", e.target.value)
          }
          placeholder="Título da seção"
        />
      </Field>

      {section.kind === "texto" ? (
        <Field label="Texto" hint="Pule linha para separar em parágrafos.">
          <AutoTextarea
            aria-label="Texto da seção"
            className={`${inputCls} min-h-[120px] resize-y`}
            value={section.text}
            onChange={(e) =>
              form.setCustomField(section.id, "text", e.target.value)
            }
            placeholder="Escreva o conteúdo desta seção..."
          />
        </Field>
      ) : (
        <div>
          <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
            Cards
          </p>
          <div className="space-y-2">
            {section.cards.map((c, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-slate-200 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Card {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Remover card"
                    onClick={() => form.removeCustomCard(section.id, i)}
                    className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                  >
                    <Close size={14} />
                  </button>
                </div>
                <input
                  aria-label={`Título do card ${i + 1}`}
                  className={inputCls}
                  value={c.title}
                  onChange={(e) =>
                    form.setCustomCardField(
                      section.id,
                      i,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Título do card"
                />
                <AutoTextarea
                  aria-label={`Texto do card ${i + 1}`}
                  className={`${inputCls} min-h-[56px] resize-y`}
                  value={c.text}
                  onChange={(e) =>
                    form.setCustomCardField(
                      section.id,
                      i,
                      "text",
                      e.target.value,
                    )
                  }
                  placeholder="Descrição do card"
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => form.addCustomCard(section.id)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
          >
            <Add size={13} /> Adicionar card
          </button>
        </div>
      )}

      <ToneToggle
        value={section.tone}
        onChange={(t) => form.setCustomTone(section.id, t)}
      />

      <button
        type="button"
        onClick={() => form.removeCustomSection(section.id)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
      >
        <Delete size={14} /> Excluir seção
      </button>
    </Accordion>
  );
}

// Seletor de modelo (template): aplica uma combinação pré-definida de variantes
// e tones em todas as seções de uma vez, preservando textos e imagens.
function ModeloPicker({
  form,
  currentId,
}: {
  form: LpForm;
  currentId: string | undefined;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-slate-500">
        Aplica um estilo visual completo (layouts e fundos de todas as seções).
        Textos e imagens não são alterados.
      </p>
      {TEMPLATES.map((template: LpTemplate) => {
        const active = currentId === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => form.applyTemplate(template)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
              active
                ? "border-ui bg-ui-soft/60"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div
              role="img"
              aria-label={template.name}
              className="h-16 w-24 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-slate-200"
              style={{
                backgroundImage: `url('${templatePreviewSrc(template.id)}')`,
              }}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span
                  className={`text-sm font-semibold ${active ? "text-ui" : "text-slate-800"}`}
                >
                  {template.name}
                </span>
                {active ? (
                  <span className="rounded-[5px] bg-ui px-1.5 py-0.5 text-[0.65rem] font-bold text-white">
                    Atual
                  </span>
                ) : null}
              </div>
              <span className="text-xs text-slate-400">
                {template.description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Painel de edição do SEO: título, descrição, keywords, OG image, indexação.
// Char counters ajudam o usuário manter os textos no tamanho ideal para Google.
function SeoPanel({ form }: { form: LpForm }) {
  const seo: Partial<SeoMeta> = form.schema.seo ?? {};
  const rawSeo: Partial<SeoMeta> = form.copy.seo ?? {};

  function update<K extends keyof SeoMeta>(key: K, value: SeoMeta[K]) {
    form.setSeoField(key, value);
  }

  const titleLen = (rawSeo.title ?? seo.title ?? "").length;
  const descLen = (rawSeo.description ?? seo.description ?? "").length;
  const titleStatus = seoCharStatus(titleLen, SEO_TITLE_IDEAL, SEO_TITLE_MAX);
  const descStatus = seoCharStatus(descLen, SEO_DESC_IDEAL, SEO_DESC_MAX);

  const charCls = (s: "ok" | "short" | "long") =>
    s === "ok"
      ? "text-emerald-600"
      : s === "long"
        ? "text-red-500"
        : "text-slate-400";

  const indexable = rawSeo.indexable ?? seo.indexable ?? false;

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
        Gerados automaticamente pela IA. Edite aqui para personalizar o que
        aparece nos resultados de busca e no compartilhamento em redes sociais.
      </p>

      <AccordionListContext.Provider value={true}>
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          <Accordion title="Título e descrição" flush defaultOpen>
            <Field
              label={`Título (${titleLen}/${SEO_TITLE_MAX} chars)`}
              hint="Aparece na aba do navegador e nos resultados de busca."
            >
              <input
                aria-label="Título SEO"
                className={inputCls}
                value={rawSeo.title ?? seo.title ?? ""}
                onChange={(e) => update("title", e.target.value)}
                maxLength={SEO_TITLE_MAX + 10}
              />
              <p className={`mt-0.5 text-[0.7rem] ${charCls(titleStatus)}`}>
                {titleStatus === "ok"
                  ? "Comprimento ideal"
                  : titleStatus === "long"
                    ? "Muito longo — será cortado"
                    : "Pode ser mais descritivo"}
              </p>
            </Field>
            <Field
              label={`Descrição (${descLen}/${SEO_DESC_MAX} chars)`}
              hint="Aparece abaixo do título nos resultados de busca."
            >
              <AutoTextarea
                aria-label="Descrição SEO"
                className={`${inputCls} min-h-[80px] resize-y`}
                value={rawSeo.description ?? seo.description ?? ""}
                onChange={(e) => update("description", e.target.value)}
              />
              <p className={`mt-0.5 text-[0.7rem] ${charCls(descStatus)}`}>
                {descStatus === "ok"
                  ? "Comprimento ideal"
                  : descStatus === "long"
                    ? "Muito longa — será cortada"
                    : "Pode ser mais descritiva"}
              </p>
            </Field>
            <Field
              label="Palavras-chave"
              hint="Separadas por vírgula. Ex: direito trabalhista, advogado SP"
            >
              <input
                aria-label="Keywords SEO"
                className={inputCls}
                value={rawSeo.keywords ?? seo.keywords ?? ""}
                onChange={(e) => update("keywords", e.target.value)}
                placeholder="direito trabalhista, advogado, São Paulo"
              />
            </Field>
          </Accordion>

          <Accordion title="Indexação e redes sociais" flush>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">
                  Indexável nos buscadores
                </p>
                <p className="text-xs text-slate-400">
                  Desative para LPs de tráfego pago (Google/Meta Ads).
                </p>
              </div>
              <button
                type="button"
                onClick={() => update("indexable", !indexable)}
                className={`shrink-0 rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                  indexable
                    ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                    : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                }`}
              >
                {indexable ? "Indexável" : "Noindex"}
              </button>
            </div>
            <Field
              label="Imagem de compartilhamento (OG)"
              hint="Aparece ao compartilhar em WhatsApp, Instagram etc. 1200×630px."
            >
              <input
                aria-label="OG Image URL"
                className={inputCls}
                value={rawSeo.ogImage ?? seo.ogImage ?? ""}
                onChange={(e) => update("ogImage", e.target.value)}
                placeholder="https://..."
                inputMode="url"
              />
            </Field>
          </Accordion>
        </div>
      </AccordionListContext.Provider>
    </div>
  );
}
