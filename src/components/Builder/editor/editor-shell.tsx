"use client";

import {
  Badge,
  Campaign,
  Close,
  CloudOff,
  ContactPage,
  DesktopWindows,
  Devices,
  FormatListNumbered,
  Gavel,
  GridView,
  Groups,
  Help,
  Image,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  Lightbulb,
  Movie,
  OpenInNew,
  ProgressActivity,
  Save,
  Search,
  SentimentDissatisfied,
  Storefront,
  SwapVert,
  Tablet,
  Tune,
  Visibility,
  Web,
} from "@material-symbols-svg/react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanelImperativeHandle } from "react-resizable-panels";
import { toast } from "sonner";
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
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { applyLpEditorSaveErrorsToForm } from "@/forms/LpEditorForm/schema";
import { useIsLgUp } from "@/hooks/use-media-query";
import { isAccessDeniedError } from "@/lib/errors";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
} from "@/lib/landing-pages/global-config";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import { getLpPublicDomain } from "@/lib/landing-pages/public-routing";
import {
  DEFAULT_LAYOUT,
  type EquipeVariant,
  type Layout,
  type StoredLp,
  type Tone,
} from "@/lib/landing-pages/schema";
import { TEMPLATES } from "@/lib/landing-pages/templates";
import {
  EQUIPE_VARIANT_SOLO_PORTRAIT,
  getAutoEquipeVariant,
  getAvailableEquipeVariants,
  getToggleEquipeVariant,
  HERO_VARIANT_CENTERED_FOCUS,
  HERO_VARIANT_STATS_AUTHORITY,
  HERO_VARIANT_VIDEO_EMBEDDED,
  isEquipeVariantAllowed,
  SOBRE_VARIANT_PHOTO_LIST,
  SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT,
} from "@/lib/landing-pages/variants";
import { extractYouTubeId } from "@/lib/landing-pages/youtube";
import { showAccessDeniedToast, showLpMessageError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { BuilderField, inputCls } from "../shared/fields";
import {
  AREAS_OPTIONS,
  AREAS_VARIANT_LABELS,
  type DetailSectionId,
  DOR_OPTIONS,
  DOR_VARIANT_LABELS,
  EQUIPE_OPTIONS,
  EQUIPE_VARIANT_LABELS,
  ETAPAS_OPTIONS,
  ETAPAS_VARIANT_LABELS,
  HERO_OPTIONS,
  HERO_VARIANT_LABELS,
  isDetailSectionId,
  type PreviewEditableSectionId,
  type PreviewVariantControl,
  SOBRE_OPTIONS,
  SOBRE_VARIANT_LABELS,
  SOLUCAO_OPTIONS,
  SOLUCAO_VARIANT_LABELS,
} from "./constants";
import {
  CORNER_OPTIONS,
  EditorSectionMenuRow,
  FieldGroup,
  Segmented,
  ToneToggle,
} from "./controls/editor-controls";
import type { EditorSectionMeta } from "./editor-section-nav";
import {
  AreasCards,
  AreasTexts,
  CtaFinalTexts,
  DorCards,
  DorTexts,
  EtapasCards,
  EtapasTexts,
  FaqPerguntas,
  FaqTexts,
  HeroTexts,
  SolucaoCards,
  SolucaoTexts,
} from "./panels/copy-panels";
import { FooterDetailPanel } from "./panels/footer-panel";
import {
  DiferenciaisInput,
  HeroFeaturesInput,
  MetricsInput,
} from "./panels/hero-inputs";
import { IdentidadePanel } from "./panels/identidade-panel";
import { IntegracoesPanel } from "./panels/integracoes-panel";
import {
  ImagensPanel,
  ModeloPicker,
  ReorderPanel,
} from "./panels/layout-panel";
import { SeoPanel } from "./panels/seo-panel";
import { SectionVariantPicker } from "./section-variant-picker";
import {
  AddSectionButton,
  CustomSectionEditor,
} from "./widgets/custom-section-editor";
import { LawyerPhotosInput } from "./widgets/lawyer-row";
import { SectionImageInput } from "./widgets/section-image-input";

const PopupBuilder = dynamic(
  () => import("./widgets/popup-builder").then((m) => m.PopupBuilder),
  { ssr: false },
);

type EditorStageId = "foundation" | "content" | "conversion";

type WorkspaceSectionMeta = Omit<EditorSectionMeta, "id"> & {
  id: DetailSectionId;
  stage: EditorStageId;
  description: string;
  enabled: boolean;
};

const PANEL_COLLAPSED_THRESHOLD_PX = 24;
const LEFT_PANEL_DEFAULT_SIZE = "22rem";
const LEFT_PANEL_MIN_SIZE = "18rem";
const LEFT_PANEL_COLLAPSED_SIZE = "0px";
const RIGHT_PANEL_DEFAULT_SIZE = "24rem";
const RIGHT_PANEL_MIN_SIZE = "20rem";
const RIGHT_PANEL_COLLAPSED_SIZE = "0px";
const PREVIEW_PANEL_MIN_SIZE = "26rem";

function getSectionDescription(sectionId: DetailSectionId): string {
  switch (sectionId) {
    case "identidade":
      return "Logo, tema e paleta da página";
    case "imagens":
      return "Fotos das seções e retratos da equipe";
    case "modelo":
      return "Combinação visual base para a landing page";
    case "aparencia":
      return "Tipografia, botões e detalhes visuais";
    case "integracoes":
      return "Tracking, scripts, domínio e captcha";
    case "seo":
      return "Título, descrição e indexação";
    case "hero":
      return "Primeira impressão da página";
    case "dor":
      return "Problemas que o cliente reconhece";
    case "solucao":
      return "Como o escritório resolve";
    case "sobre":
      return "Apresentação institucional";
    case "equipe":
      return "Fotos e presença dos advogados";
    case "areas":
      return "Áreas de atuação e expertise";
    case "etapas":
      return "Passo a passo do atendimento";
    case "faq":
      return "Dúvidas antes do contato";
    case "ctaFinal":
      return "Convite final para conversão";
    case "footer":
      return "Contato, endereço e privacidade";
    default:
      return "";
  }
}

/** Preview da URL pública da LP — layout único, discreto, para publicado e rascunho. */
function PublicLpUrlPreview({
  officeSubdomain,
  slug,
  status,
}: {
  officeSubdomain: string;
  slug: string;
  status: "draft" | "published";
}) {
  const lpDomain = getLpPublicDomain() || "causi.adv.br";
  const isLive = status === "published";

  const content = (
    <>
      <span className="flex shrink-0 items-center gap-1.5">
        <span className="relative flex size-1.5" aria-hidden>
          {isLive ? (
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
          ) : null}
          <span
            className={cn(
              "relative size-1.5 rounded-full",
              isLive
                ? "bg-emerald-500/70"
                : "bg-rose-400/55 dark:bg-rose-400/45",
            )}
          />
        </span>
        <span className="text-[10px] text-muted-foreground">
          {isLive ? "Ao vivo" : "Offline"}
        </span>
      </span>
      <span aria-hidden className="h-3 w-px shrink-0 bg-border/80" />
      <span
        className={cn(
          "min-w-0 truncate font-mono text-[11px] leading-none tabular-nums",
          !isLive && "opacity-80",
        )}
      >
        <span className="font-medium text-foreground/90">
          {officeSubdomain}
        </span>
        <span className="text-muted-foreground/40">.{lpDomain}/</span>
        <span className="font-medium text-foreground/90">{slug}</span>
      </span>
      {isLive ? (
        <OpenInNew
          size={12}
          className="size-3 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden
        />
      ) : null}
    </>
  );

  const shellClass =
    "inline-flex max-w-full items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1";

  if (isLive) {
    return (
      <a
        href={publicLpUrl(officeSubdomain, slug)}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir site publicado em nova aba"
        className={cn(
          shellClass,
          "group transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/60",
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <div
      className={shellClass}
      title="Landing page fora do ar — publique para ativar o link"
    >
      {content}
    </div>
  );
}

export function Editor({
  form,
  slug,
  officeSubdomain,
  name,
  status: initialStatus,
  initialAccountConfig,
}: {
  form: LpEditorForm;
  slug: string;
  officeSubdomain: string;
  name: string;
  status?: "draft" | "published";
  initialAccountConfig: GlobalConfig;
}) {
  const router = useRouter();
  const { office, set, layout } = form;
  const tones = layout.tones ?? DEFAULT_LAYOUT.tones;
  const previewRef = useRef<HTMLIFrameElement>(null);
  const leftPanelRef = useRef<PanelImperativeHandle>(null);
  const rightPanelRef = useRef<PanelImperativeHandle>(null);
  const isLgUp = useIsLgUp();
  const [mobileTab, setMobileTab] = useState<"navigation" | "preview" | "cms">(
    "navigation",
  );
  const showNavigationPanel = isLgUp || mobileTab === "navigation";
  const showPreviewPanel = isLgUp || mobileTab === "preview";
  const showCmsPanel = isLgUp || mobileTab === "cms";
  const [viewport, setViewport] = useState<Viewport>("desktop");
  // Modal de personalização do formulário do popup de lead.
  const [builderOpen, setBuilderOpen] = useState(false);
  // Modo "Mudar sequência": colapsa tudo e mostra só as seções arrastáveis.
  const [reorderMode, setReorderMode] = useState(false);
  // Mestre-detalhe: seção aberta no painel de configuração (null = menu inicial).
  const [detailSection, setDetailSection] = useState<DetailSectionId | null>(
    null,
  );
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const dirty = form.isDirty;
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">(
    initialStatus ?? "draft",
  );
  const [publishState, setPublishState] = useState<"idle" | "saving" | "error">(
    "idle",
  );
  const accountConfig = initialAccountConfig ?? DEFAULT_CONFIG;
  const [restoreDefaultsOpen, setRestoreDefaultsOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const isPublishing = publishState === "saving";
  const lawyerCount = office.lawyers?.length ?? 0;

  const needsVideo = layout.hero === HERO_VARIANT_VIDEO_EMBEDDED;
  const needsMetrics = layout.hero === HERO_VARIANT_STATS_AUTHORITY;
  // Só o Hero centralizado mostra os mini-cards de destaque (ícone + texto).
  const needsCards = layout.hero === HERO_VARIANT_CENTERED_FOCUS;

  const heroOptions = useMemo(
    () =>
      form.videoId
        ? HERO_OPTIONS
        : HERO_OPTIONS.filter((o) => o.id !== HERO_VARIANT_VIDEO_EMBEDDED),
    [form.videoId],
  );

  const availableEquipeOptions = useMemo(
    () =>
      EQUIPE_OPTIONS.filter((option) =>
        getAvailableEquipeVariants(lawyerCount).includes(
          option.id as EquipeVariant,
        ),
      ),
    [lawyerCount],
  );

  const equipeVariant = useMemo(() => {
    if (isEquipeVariantAllowed(lawyerCount, layout.equipe)) {
      return layout.equipe ?? getAutoEquipeVariant(lawyerCount);
    }
    return (
      getAutoEquipeVariant(lawyerCount) ??
      (availableEquipeOptions[0]?.id as EquipeVariant | undefined)
    );
  }, [availableEquipeOptions, lawyerCount, layout.equipe]);

  const editorNotices = useMemo(() => {
    if (lawyerCount === 0) {
      return [
        {
          id: "equipe-empty",
          title: "Equipe indisponível",
          description:
            "Adicione ao menos um advogado para liberar a seção Equipe no editor.",
        },
      ];
    }

    if (lawyerCount === 1 && layout.equipe !== EQUIPE_VARIANT_SOLO_PORTRAIT) {
      return [
        {
          id: "equipe-solo-only",
          title: "Somente Retrato solo",
          description:
            "Com um advogado, a seção Equipe só pode usar a variação Retrato solo.",
        },
      ];
    }

    if (lawyerCount >= 2 && layout.equipe === EQUIPE_VARIANT_SOLO_PORTRAIT) {
      return [
        {
          id: "equipe-multi-only",
          title: "Variação solo incompatível",
          description:
            "Com dois ou mais advogados, use Split alternado ou Retrato elegante.",
        },
      ];
    }

    return [];
  }, [lawyerCount, layout.equipe]);

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

  const editorSections = useMemo((): WorkspaceSectionMeta[] => {
    const items: WorkspaceSectionMeta[] = [
      {
        id: "identidade",
        label: "Identidade",
        previewTarget: "sec-hero",
        description: getSectionDescription("identidade"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "imagens",
        label: "Imagens",
        previewTarget: "sec-hero",
        description: getSectionDescription("imagens"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "modelo",
        label: "Modelo",
        previewTarget: "sec-hero",
        description: getSectionDescription("modelo"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "aparencia",
        label: "Aparência",
        previewTarget: "sec-hero",
        description: getSectionDescription("aparencia"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "integracoes",
        label: "Integrações",
        previewTarget: "sec-hero",
        description: getSectionDescription("integracoes"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "seo",
        label: "SEO",
        previewTarget: "sec-hero",
        description: getSectionDescription("seo"),
        stage: "foundation",
        enabled: true,
      },
      {
        id: "hero",
        label: "Topo",
        previewTarget: "sec-hero",
        description: getSectionDescription("hero"),
        stage: "content",
        enabled: true,
        variantLabel: layout.hero
          ? HERO_VARIANT_LABELS[layout.hero]
          : undefined,
      },
      {
        id: "dor",
        label: "Dores",
        previewTarget: "sec-dor",
        description: getSectionDescription("dor"),
        stage: "content",
        enabled: true,
        variantLabel: layout.dor ? DOR_VARIANT_LABELS[layout.dor] : undefined,
      },
      {
        id: "solucao",
        label: "Solução",
        previewTarget: "sec-solucao",
        description: getSectionDescription("solucao"),
        stage: "content",
        enabled: true,
        variantLabel: layout.solucao
          ? SOLUCAO_VARIANT_LABELS[layout.solucao]
          : undefined,
      },
      {
        id: "sobre",
        label: "Sobre",
        previewTarget: "sec-sobre",
        description: getSectionDescription("sobre"),
        stage: "content",
        enabled: true,
        variantLabel: layout.sobre
          ? SOBRE_VARIANT_LABELS[layout.sobre]
          : undefined,
      },
      {
        id: "equipe",
        label: "Equipe",
        previewTarget: "sec-equipe",
        description: getSectionDescription("equipe"),
        stage: "content",
        enabled: !layout.hidden?.equipe,
        variantLabel: layout.equipe
          ? EQUIPE_VARIANT_LABELS[layout.equipe]
          : undefined,
      },
      {
        id: "areas",
        label: "Áreas",
        previewTarget: "sec-areas",
        description: getSectionDescription("areas"),
        stage: "content",
        enabled: !layout.hidden?.areas,
        variantLabel: layout.areas
          ? AREAS_VARIANT_LABELS[layout.areas]
          : undefined,
      },
      {
        id: "etapas",
        label: "Etapas",
        previewTarget: "sec-etapas",
        description: getSectionDescription("etapas"),
        stage: "content",
        enabled: !layout.hidden?.etapas,
        variantLabel: layout.etapas
          ? ETAPAS_VARIANT_LABELS[layout.etapas]
          : undefined,
      },
      {
        id: "faq",
        label: "FAQ",
        previewTarget: "sec-faq",
        description: getSectionDescription("faq"),
        stage: "conversion",
        enabled: !layout.hidden?.faq,
      },
      {
        id: "ctaFinal",
        label: "CTA final",
        previewTarget: "sec-ctaFinal",
        description: getSectionDescription("ctaFinal"),
        stage: "conversion",
        enabled: !layout.hidden?.ctaFinal,
      },
      {
        id: "footer",
        label: "Rodapé",
        previewTarget: "sec-footer",
        description: getSectionDescription("footer"),
        stage: "conversion",
        enabled: true,
      },
    ];
    return items;
  }, [layout]);

  const currentDetail =
    detailSection === null
      ? null
      : (editorSections.find((section) => section.id === detailSection) ??
        null);
  const resourceSections = editorSections.filter(
    (section) => section.stage === "foundation",
  );
  const contentSections = editorSections.filter(
    (section) => section.stage === "content",
  );
  const conversionSections = editorSections.filter(
    (section) => section.stage === "conversion",
  );
  const lifecycleMessage =
    status === "published"
      ? dirty
        ? "O site está no ar. Salve para publicar as alterações da prévia."
        : "Site publicado e sincronizado com a versão ao vivo."
      : dirty
        ? "Há alterações locais aguardando salvamento antes da publicação."
        : "Rascunho salvo. Continue editando ou publique quando estiver pronto.";
  const syncDetailSectionUrl = useCallback((id: DetailSectionId | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("sec", id);
    else url.searchParams.delete("sec");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, []);
  const previewVariantControls = useMemo<
    Partial<Record<PreviewEditableSectionId, PreviewVariantControl>>
  >(
    () => ({
      hero: {
        label: "Topo",
        options: heroOptions,
        value: layout.hero,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            hero: id as Layout["hero"],
          }));
        },
      },
      dor: {
        label: "Dores",
        options: DOR_OPTIONS,
        value: layout.dor,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            dor: id as Layout["dor"],
          }));
        },
      },
      solucao: {
        label: "Solução",
        options: SOLUCAO_OPTIONS,
        value: layout.solucao,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            solucao: id as Layout["solucao"],
          }));
        },
      },
      sobre: {
        label: "Sobre",
        options: SOBRE_OPTIONS,
        value: layout.sobre,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            sobre: id as Layout["sobre"],
          }));
        },
      },
      equipe: availableEquipeOptions.length
        ? {
            label: "Equipe",
            options: availableEquipeOptions,
            value: equipeVariant ?? availableEquipeOptions[0].id,
            onChange: (id) => {
              form.setLayout((currentLayout) => ({
                ...currentLayout,
                equipe: id as EquipeVariant,
              }));
            },
          }
        : undefined,
      areas: {
        label: "Áreas",
        options: AREAS_OPTIONS,
        value: layout.areas,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            areas: id as Layout["areas"],
          }));
        },
      },
      etapas: {
        label: "Etapas",
        options: ETAPAS_OPTIONS,
        value: layout.etapas,
        onChange: (id) => {
          form.setLayout((currentLayout) => ({
            ...currentLayout,
            etapas: id as Layout["etapas"],
          }));
        },
      },
    }),
    [
      availableEquipeOptions,
      heroOptions,
      layout.hero,
      layout.dor,
      layout.solucao,
      layout.sobre,
      layout.areas,
      layout.etapas,
      equipeVariant,
      form,
    ],
  );

  function toggleLeftPanel() {
    const panel = leftPanelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
      setLeftPanelCollapsed(false);
      return;
    }

    panel.collapse();
    setLeftPanelCollapsed(true);
  }

  function toggleRightPanel() {
    const panel = rightPanelRef.current;
    if (!panel) return;

    if (panel.isCollapsed()) {
      panel.expand();
      setRightPanelCollapsed(false);
      return;
    }

    panel.collapse();
    setRightPanelCollapsed(true);
  }

  function goToDetailSection(id: DetailSectionId) {
    setDetailSection(id);
    syncDetailSectionUrl(id);
    if (!isLgUp) setMobileTab("cms");
    const target =
      editorSections.find((s) => s.id === id)?.previewTarget ?? `sec-${id}`;
    scrollToSection(target);
  }

  function getSectionToggle(sectionId: DetailSectionId) {
    switch (sectionId) {
      case "equipe":
        return {
          on: !layout.hidden?.equipe,
          onChange: (on: boolean) => {
            if (!on) {
              form.setSectionHidden("equipe", true);
              return;
            }

            const nextVariant =
              (isEquipeVariantAllowed(lawyerCount, layout.equipe)
                ? layout.equipe
                : getToggleEquipeVariant(lawyerCount)) ?? undefined;

            if (!nextVariant) {
              toast.error("A seção Equipe ainda não pode ser ativada.", {
                description:
                  "Adicione pelo menos um advogado para liberar essa seção.",
              });
              return;
            }

            if (layout.equipe !== nextVariant) {
              form.setLayout((currentLayout) => ({
                ...currentLayout,
                equipe: nextVariant,
              }));

              toast("Variant da Equipe ajustada", {
                description:
                  nextVariant === EQUIPE_VARIANT_SOLO_PORTRAIT
                    ? "A variação Retrato solo foi aplicada para apresentar um único advogado."
                    : "A variação da Equipe foi ajustada para a quantidade atual de advogados.",
              });
            }

            form.setSectionHidden("equipe", false);
          },
        };
      case "areas":
        return {
          on: !layout.hidden?.areas,
          onChange: (on: boolean) => form.setSectionHidden("areas", !on),
        };
      case "etapas":
        return {
          on: !layout.hidden?.etapas,
          onChange: (on: boolean) => form.setSectionHidden("etapas", !on),
        };
      case "faq":
        return {
          on: !layout.hidden?.faq,
          onChange: (on: boolean) => form.setSectionHidden("faq", !on),
        };
      case "ctaFinal":
        return {
          on: !layout.hidden?.ctaFinal,
          onChange: (on: boolean) => form.setSectionHidden("ctaFinal", !on),
        };
      default:
        return undefined;
    }
  }

  // Restaura a seção aberta a partir da URL (?sec=hero) após refresh ou HMR.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sec = params.get("sec");
    if (isDetailSectionId(sec)) {
      setDetailSection(sec);
    }
  }, []);

  useEffect(() => {
    if (layout.hidden?.equipe) return;
    if (isEquipeVariantAllowed(lawyerCount, layout.equipe)) return;

    form.setSectionHidden("equipe", true);
    toast("Seção Equipe ocultada", {
      description:
        lawyerCount === 1
          ? "Com um advogado, a seção Equipe exige a variação Retrato solo."
          : lawyerCount === 0
            ? "Adicione ao menos um advogado para habilitar a seção Equipe."
            : "A variação atual da Equipe não é compatível com a quantidade de advogados.",
    });
  }, [form, lawyerCount, layout.equipe, layout.hidden?.equipe]);

  // Ao abrir um accordeon, rola o preview até a seção correspondente. O preview
  // vive dentro de um <iframe>, então busca-se a seção no documento do iframe.
  function scrollToSection(id: string) {
    requestAnimationFrame(() => {
      previewRef.current?.contentDocument
        ?.getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function salvar() {
    form.form.clearErrors();
    const saveError = form.validateSave();
    if (saveError) {
      applyLpEditorSaveErrorsToForm(form.form, saveError);
      setSaveState("error");
      showLpMessageError(
        saveError.issues[0]?.message ?? "Dados inválidos para salvar",
      );
      return false;
    }
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
        return false;
      }
      form.markSaved();
      setSaveState("saved");
      return true;
    } catch {
      setSaveState("error");
      return false;
    }
  }

  function restoreAccountDefaults() {
    form.applyAccountDefaults(accountConfig, true);
    setRestoreDefaultsOpen(false);
    toast.success("Padrão da conta aplicado nesta página.");
  }

  async function publicar() {
    if (dirty) {
      const saved = await salvar();
      if (!saved) {
        setPublishState("idle");
        return;
      }
    }

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
        if (res.error && isAccessDeniedError(res.error))
          showAccessDeniedToast();
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

  function renderSectionIcon(sectionId: DetailSectionId) {
    switch (sectionId) {
      case "identidade":
        return <Storefront size={18} />;
      case "imagens":
        return <Image size={18} />;
      case "modelo":
        return <GridView size={18} />;
      case "aparencia":
        return <Tune size={18} />;
      case "integracoes":
        return <Campaign size={18} />;
      case "seo":
        return <Search size={18} />;
      case "hero":
        return <Web size={18} />;
      case "dor":
        return <SentimentDissatisfied size={18} />;
      case "solucao":
        return <Lightbulb size={18} />;
      case "sobre":
        return <Badge size={18} />;
      case "equipe":
        return <Groups size={18} />;
      case "areas":
        return <Gavel size={18} />;
      case "etapas":
        return <FormatListNumbered size={18} />;
      case "faq":
        return <Help size={18} />;
      case "ctaFinal":
        return <Campaign size={18} />;
      case "footer":
        return <ContactPage size={18} />;
    }
  }

  // Agrupa seletor de layout + tom de fundo num único cartão nativo, em vez
  // de dois controles soltos flutuando no painel.
  function renderSectionSettings(
    variant: PreviewVariantControl | undefined,
    tone?: { value: Tone; onChange: (t: Tone) => void },
  ) {
    if (!variant && !tone) return null;
    return (
      <div className="divide-y divide-border rounded-xl border border-border bg-background px-4">
        {variant ? (
          <div className="py-3">
            <SectionVariantPicker control={variant} />
          </div>
        ) : null}
        {tone ? (
          <div className="py-3">
            <ToneToggle value={tone.value} onChange={tone.onChange} />
          </div>
        ) : null}
      </div>
    );
  }

  function renderNavigationGroup({
    step,
    title,
    sections,
  }: {
    step: string;
    title: string;
    sections: WorkspaceSectionMeta[];
  }) {
    return (
      <section className="space-y-1.5">
        <div className="flex items-center justify-between min-w-0 gap-2 px-2">
          <p className="truncate text-xs font-semibold text-foreground">
            {title}
          </p>
        </div>
        <div className="space-y-0.5">
          {sections.map((section) => (
            <EditorSectionMenuRow
              key={section.id}
              title={section.label}
              meta={section.variantLabel}
              icon={
                <span
                  className={cn(
                    "inline-flex size-7 items-center justify-center rounded-md",
                    section.enabled
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground/50",
                  )}
                >
                  {renderSectionIcon(section.id)}
                </span>
              }
              toggle={getSectionToggle(section.id)}
              active={detailSection === section.id}
              onPress={() => goToDetailSection(section.id)}
            />
          ))}
        </div>
      </section>
    );
  }

  const navigationPanel = (
    <aside
      className={cn(
        "min-h-0 flex-col overflow-hidden border-border bg-card",
        isLgUp
          ? cn(
              "flex h-full min-w-0 transition-[opacity] duration-200",
              leftPanelCollapsed
                ? "border-r-0 opacity-0"
                : "border-r opacity-100",
            )
          : showNavigationPanel
            ? "flex border-b"
            : "hidden border-b",
      )}
    >
      <div className="border-b border-border px-3 py-2.5">
        <div className="space-y-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground">
              Navegação
            </p>
            <p className="text-[11px] text-muted-foreground">
              Clique em um item para editar à direita.
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {reorderMode ? (
          <ReorderPanel form={form} onClose={() => setReorderMode(false)} />
        ) : (
          <div className="space-y-2">
            {renderNavigationGroup({
              step: "1",
              title: "Recursos da página",
              sections: resourceSections,
            })}

            {renderNavigationGroup({
              step: "2",
              title: "Seções principais",
              sections: contentSections,
            })}

            {renderNavigationGroup({
              step: "3",
              title: "Conversão e fechamento",
              sections: conversionSections,
            })}

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 px-1">
                  <p className="text-xs font-semibold text-foreground">
                    Seções personalizadas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setReorderMode(true)}
                >
                  <SwapVert size={14} />
                  Reordenar
                </Button>
              </div>

              {form.customSections.length ? (
                <div className="space-y-0.5">
                  {form.customSections.map((sec) => (
                    <CustomSectionEditor
                      key={sec.id}
                      form={form}
                      section={sec}
                      onScroll={() => scrollToSection(`sec-custom-${sec.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                  Nenhuma seção personalizada adicionada.
                </div>
              )}

              <AddSectionButton onAdd={form.addCustomSection} />
            </section>

            {editorNotices.length ? (
              <section className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    Avisos da página
                  </p>
                </div>
                <div className="space-y-2">
                  {editorNotices.map((notice) => (
                    <div key={notice.id} className="space-y-1">
                      <p className="text-xs font-medium text-amber-950">
                        {notice.title}
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-900/80">
                        {notice.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );

  const previewPanel = (
    <main
      className={cn(
        "min-h-0 flex-col overflow-hidden border-border bg-card",
        isLgUp
          ? "flex h-full min-w-0 border-r"
          : showPreviewPanel
            ? "flex border-b"
            : "hidden border-b",
      )}
    >
      <div className="border-b border-border px-5 py-3">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex items-center gap-2">
            {isLgUp ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={toggleLeftPanel}
                title={
                  leftPanelCollapsed
                    ? "Mostrar navegação"
                    : "Esconder navegação"
                }
              >
                {leftPanelCollapsed ? (
                  <KeyboardArrowRight size={18} />
                ) : (
                  <KeyboardArrowLeft size={18} />
                )}
                <span className="sr-only">
                  {leftPanelCollapsed
                    ? "Mostrar navegação"
                    : "Esconder navegação"}
                </span>
              </Button>
            ) : null}
            <div className="min-w-0 space-y-1">
              <PublicLpUrlPreview
                officeSubdomain={officeSubdomain}
                slug={slug}
                status={status}
              />
            </div>
          </div>

          <div className="flex justify-center">
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
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition",
                    viewport === id
                      ? "bg-ui-soft text-ui"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            {isLgUp ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={toggleRightPanel}
                title={rightPanelCollapsed ? "Mostrar CMS" : "Esconder CMS"}
              >
                {rightPanelCollapsed ? (
                  <KeyboardArrowLeft size={18} />
                ) : (
                  <KeyboardArrowRight size={18} />
                )}
                <span className="sr-only">
                  {rightPanelCollapsed ? "Mostrar CMS" : "Esconder CMS"}
                </span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <DevicePreview ref={previewRef} mode={viewport}>
          <LandingPreview
            schema={form.schema}
            editor={{ variantControls: previewVariantControls }}
          />
        </DevicePreview>
      </div>
    </main>
  );

  const cmsPanel = (
    <aside
      className={cn(
        "min-h-0 flex-col overflow-hidden bg-card",
        isLgUp
          ? cn(
              "flex h-full min-w-0 transition-[opacity] duration-200",
              rightPanelCollapsed ? "opacity-0" : "opacity-100",
            )
          : showCmsPanel
            ? "flex"
            : "hidden",
      )}
    >
      <div className="border-b border-border px-4 py-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {currentDetail?.variantLabel ? (
              <UiBadge variant="secondary">
                {currentDetail.variantLabel}
              </UiBadge>
            ) : null}
            {!currentDetail?.enabled && currentDetail ? (
              <UiBadge variant="muted">Oculta na página</UiBadge>
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {currentDetail?.label ?? "Campos editáveis"}
            </p>
            <p className="text-sm text-muted-foreground">
              {currentDetail
                ? currentDetail.id === "hero" ||
                  currentDetail.id === "dor" ||
                  currentDetail.id === "solucao" ||
                  currentDetail.id === "sobre" ||
                  currentDetail.id === "equipe" ||
                  currentDetail.id === "areas" ||
                  currentDetail.id === "etapas"
                  ? `${currentDetail.description}. Use as setas no topo do preview para mostrar ou esconder os painéis laterais e o seletor abaixo para mudar o layout.`
                  : currentDetail.description
                : "Texto, imagens, cores e conteúdo do bloco selecionado aparecem aqui."}
            </p>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {!detailSection ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Selecione um bloco para editar
              </p>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Use a navegação da esquerda para abrir os campos. O seletor de
                variação de cada bloco já aparece flutuando no canto do preview,
                a qualquer momento.
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 max-w-full space-y-3">
            {detailSection === "identidade" && <IdentidadePanel form={form} />}
            {detailSection === "imagens" && <ImagensPanel form={form} />}
            {detailSection === "modelo" && (
              <ModeloPicker form={form} currentId={currentTemplateId} />
            )}
            {detailSection === "seo" && <SeoPanel form={form} />}
            {detailSection === "integracoes" && (
              <IntegracoesPanel
                form={form}
                accountConfig={accountConfig}
                onRestoreDefaults={() => setRestoreDefaultsOpen(true)}
              />
            )}
            {detailSection === "hero" && (
              <>
                {renderSectionSettings(previewVariantControls.hero, {
                  value: tones.hero ?? "light",
                  onChange: (t) => form.setTone("hero", t),
                })}
                <SectionImageInput form={form} sectionKey="hero" />
                <FieldGroup title="Textos">
                  <HeroTexts form={form} />
                </FieldGroup>
                {needsVideo ? (
                  <FieldGroup title="Vídeo">
                    <BuilderField
                      label="Link do vídeo do YouTube"
                      hint="Cole o link do YouTube — a gente identifica o vídeo."
                    >
                      <div className="flex items-center gap-2">
                        <Movie size={16} className="shrink-0 text-slate-400" />
                        <Input
                          aria-label="Link do vídeo do YouTube"
                          value={form.videoId}
                          onChange={(e) =>
                            form.setVideoId(extractYouTubeId(e.target.value))
                          }
                          placeholder="Cole o link (ex: youtube.com/watch?v=...)"
                        />
                      </div>
                    </BuilderField>
                  </FieldGroup>
                ) : null}
                {needsMetrics ? (
                  <FieldGroup title="Métricas">
                    <MetricsInput form={form} />
                  </FieldGroup>
                ) : null}
                {needsCards ? (
                  <FieldGroup title="Mini-cards">
                    <HeroFeaturesInput form={form} />
                  </FieldGroup>
                ) : null}
              </>
            )}
            {detailSection === "aparencia" && (
              <>
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

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <BuilderField
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
                  </BuilderField>
                  {(office.buttons?.action ?? "popup") === "link" ? (
                    <BuilderField
                      label="Link do botão"
                      hint="Endereço completo (ex.: https://...)."
                    >
                      <Input
                        value={office.buttons?.link ?? ""}
                        onChange={(e) =>
                          form.setButtonField("link", e.target.value)
                        }
                        placeholder="https://..."
                        inputMode="url"
                      />
                    </BuilderField>
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
                        Adicione perguntas personalizadas (texto, e-mail, valor,
                        CEP, etc.) antes desse passo.
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

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <p className="text-sm font-medium text-slate-700">
                    Tipografia
                  </p>
                  <BuilderField
                    label="Títulos e destaques"
                    hint="Fonte usada nos títulos de seção e manchetes."
                  >
                    <select
                      aria-label="Fonte dos títulos"
                      className={inputCls}
                      value={office.fonts?.heading ?? ""}
                      onChange={(e) => form.setFont("heading", e.target.value)}
                    >
                      <option value="">Padrão do site</option>
                      {HEADING_FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </BuilderField>
                  <BuilderField
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
                  </BuilderField>
                </div>
              </>
            )}
            {detailSection === "dor" && (
              <>
                {renderSectionSettings(previewVariantControls.dor, {
                  value: tones.dor,
                  onChange: (t) => form.setTone("dor", t),
                })}
                <SectionImageInput form={form} sectionKey="dor" />
                <FieldGroup title="Textos">
                  <DorTexts form={form} />
                </FieldGroup>
                <FieldGroup title="Cards">
                  <DorCards form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "solucao" && (
              <>
                {renderSectionSettings(previewVariantControls.solucao, {
                  value: tones.solucao,
                  onChange: (t) => form.setTone("solucao", t),
                })}
                <SectionImageInput form={form} sectionKey="solucao" />
                <FieldGroup title="Textos">
                  <SolucaoTexts form={form} />
                </FieldGroup>
                <FieldGroup title="Cards">
                  <SolucaoCards form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "sobre" && (
              <>
                {renderSectionSettings(previewVariantControls.sobre, {
                  value: tones.sobre,
                  onChange: (t) => form.setTone("sobre", t),
                })}
                <SectionImageInput form={form} sectionKey="sobre" />
                <FieldGroup title="Texto">
                  <BuilderField
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
                  </BuilderField>
                </FieldGroup>
                {layout.sobre === SOBRE_VARIANT_PHOTO_LIST ||
                layout.sobre === SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT ? (
                  <FieldGroup title="Diferenciais">
                    <DiferenciaisInput form={form} />
                  </FieldGroup>
                ) : null}
              </>
            )}
            {detailSection === "equipe" && (
              <>
                {renderSectionSettings(
                  previewVariantControls.equipe,
                  availableEquipeOptions.length
                    ? {
                        value: tones.equipe,
                        onChange: (t) => form.setTone("equipe", t),
                      }
                    : undefined,
                )}
                <LawyerPhotosInput form={form} />
              </>
            )}
            {detailSection === "areas" && (
              <>
                {renderSectionSettings(previewVariantControls.areas, {
                  value: tones.areas,
                  onChange: (t) => form.setTone("areas", t),
                })}
                <FieldGroup title="Textos">
                  <AreasTexts form={form} />
                </FieldGroup>
                <FieldGroup title="Cards">
                  <AreasCards form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "etapas" && (
              <>
                {renderSectionSettings(previewVariantControls.etapas, {
                  value: tones.etapas,
                  onChange: (t) => form.setTone("etapas", t),
                })}
                <FieldGroup title="Textos">
                  <EtapasTexts form={form} />
                </FieldGroup>
                <FieldGroup title="Passos">
                  <EtapasCards form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "faq" && (
              <>
                {renderSectionSettings(undefined, {
                  value: tones.faq,
                  onChange: (t) => form.setTone("faq", t),
                })}
                <FieldGroup title="Textos">
                  <FaqTexts form={form} />
                </FieldGroup>
                <FieldGroup title="Perguntas">
                  <FaqPerguntas form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "ctaFinal" && (
              <>
                {renderSectionSettings(undefined, {
                  value: tones.ctaFinal,
                  onChange: (t) => form.setTone("ctaFinal", t),
                })}
                <FieldGroup title="Textos">
                  <CtaFinalTexts form={form} />
                </FieldGroup>
              </>
            )}
            {detailSection === "footer" && (
              <FooterDetailPanel form={form} office={office} />
            )}
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <Form {...form.form}>
      <div className="app-ui flex h-[100dvh] min-h-[100dvh] w-full max-w-full min-w-0 flex-col overflow-hidden bg-muted/40">
        <ConfirmDialog
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title="Alterações não salvas"
          description="Você tem alterações que ainda não foram salvas. Sair mesmo assim?"
          confirmLabel="Sair sem salvar"
          variant="destructive"
          onConfirm={() => router.push("/")}
        />
        <ConfirmDialog
          open={restoreDefaultsOpen}
          onOpenChange={setRestoreDefaultsOpen}
          title="Restaurar padrão da conta"
          description="Isso substitui o tracking, os scripts, o captcha e o domínio desta página pelos valores padrão da conta. Continuar?"
          confirmLabel="Restaurar"
          variant="destructive"
          onConfirm={restoreAccountDefaults}
        />
        <div className="shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-5">
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-12 lg:items-center lg:gap-4">
            <div className="flex min-w-0 items-center gap-2 lg:col-span-3">
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  if (dirty) {
                    setLeaveOpen(true);
                    return;
                  }
                  router.push("/");
                }}
              >
                <Close size={16} />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {office.name || name}
                </p>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:col-span-6 lg:justify-center">
              <UiBadge variant={dirty ? "secondary" : "muted"}>
                {dirty ? "Alterações locais" : "Tudo salvo"}
              </UiBadge>
              <UiBadge
                variant={status === "published" ? "secondary" : "outline"}
              >
                {status === "published" ? "Publicado" : "Rascunho"}
              </UiBadge>
              <p className="min-w-0 flex-1 text-sm text-muted-foreground lg:flex-none">
                {lifecycleMessage}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:col-span-3 lg:justify-end">
              <Button
                type="button"
                variant={dirty ? "default" : "outline"}
                size="sm"
                onClick={salvar}
                disabled={!dirty || saveState === "saving" || isPublishing}
              >
                {saveState === "saving" ? (
                  <ProgressActivity size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Salvar
              </Button>
              {status === "published" ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={despublicar}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <ProgressActivity size={16} className="animate-spin" />
                  ) : (
                    <CloudOff size={16} />
                  )}
                  Retirar do ar
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={publicar}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    <ProgressActivity size={16} className="animate-spin" />
                  ) : null}
                  {dirty ? "Salvar e publicar" : "Publicar"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLgUp ? (
          <ResizablePanelGroup
            id="lp-editor-panels"
            orientation="horizontal"
            className="min-h-0 flex-1"
          >
            <ResizablePanel
              id="editor-navigation"
              panelRef={leftPanelRef}
              defaultSize={LEFT_PANEL_DEFAULT_SIZE}
              minSize={LEFT_PANEL_MIN_SIZE}
              collapsedSize={LEFT_PANEL_COLLAPSED_SIZE}
              collapsible
              groupResizeBehavior="preserve-pixel-size"
              className="min-w-0"
              onResize={(panelSize) =>
                setLeftPanelCollapsed(
                  panelSize.inPixels <= PANEL_COLLAPSED_THRESHOLD_PX,
                )
              }
            >
              {navigationPanel}
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className={cn(
                leftPanelCollapsed && "pointer-events-none opacity-0",
              )}
            />
            <ResizablePanel
              id="editor-preview"
              minSize={PREVIEW_PANEL_MIN_SIZE}
              className="min-w-0"
            >
              {previewPanel}
            </ResizablePanel>
            <ResizableHandle
              withHandle
              className={cn(
                rightPanelCollapsed && "pointer-events-none opacity-0",
              )}
            />
            <ResizablePanel
              id="editor-cms"
              panelRef={rightPanelRef}
              defaultSize={RIGHT_PANEL_DEFAULT_SIZE}
              minSize={RIGHT_PANEL_MIN_SIZE}
              collapsedSize={RIGHT_PANEL_COLLAPSED_SIZE}
              collapsible
              groupResizeBehavior="preserve-pixel-size"
              className="min-w-0"
              onResize={(panelSize) =>
                setRightPanelCollapsed(
                  panelSize.inPixels <= PANEL_COLLAPSED_THRESHOLD_PX,
                )
              }
            >
              {cmsPanel}
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <div className="min-h-0 flex-1">
            {navigationPanel}
            {previewPanel}
            {cmsPanel}
          </div>
        )}

        {!isLgUp ? (
          <nav
            aria-label="Alternar áreas do editor"
            className="flex shrink-0 border-t border-border bg-background supports-[padding:max(0px)]:pb-[max(0px,env(safe-area-inset-bottom))] lg:hidden"
          >
            <button
              type="button"
              onClick={() => setMobileTab("navigation")}
              aria-pressed={mobileTab === "navigation"}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
                mobileTab === "navigation"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GridView size={20} />
              Navegação
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
            <button
              type="button"
              onClick={() => setMobileTab("cms")}
              aria-pressed={mobileTab === "cms"}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition",
                mobileTab === "cms"
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Tune size={20} />
              CMS
            </button>
          </nav>
        ) : null}

        {builderOpen ? (
          <PopupBuilder form={form} onClose={() => setBuilderOpen(false)} />
        ) : null}
      </div>
    </Form>
  );
}
