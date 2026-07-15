"use client";

import {
  ArrowBack,
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
  KeyboardArrowDown,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  Lightbulb,
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
import { useAppChrome } from "@/components/app-chrome-context";
import { AutoTextarea } from "@/components/auto-textarea";
import {
  DevicePreview,
  type Viewport,
} from "@/components/Preview/device-preview";
import { LandingPreview } from "@/components/Preview/landing-preview";
import { hasExplicitHeroBand } from "@/components/Sections/hero";
import { Badge as UiBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
import { useSession } from "@/hooks/use-session";
import { isAccessDeniedError } from "@/lib/errors";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import {
  DEFAULT_CONFIG,
  type GlobalConfig,
} from "@/lib/landing-pages/global-config";
import { publicLpUrl } from "@/lib/landing-pages/lp-url";
import {
  DEFAULT_LAYOUT,
  type EquipeVariant,
  type Layout,
  type StoredLp,
  type Tone,
} from "@/lib/landing-pages/schema";
import {
  EQUIPE_VARIANT_SOLO_PORTRAIT,
  getAutoEquipeVariant,
  getAvailableEquipeVariants,
  getToggleEquipeVariant,
  HERO_VARIANT_STATS_AUTHORITY,
  isEquipeVariantAllowed,
  SOBRE_VARIANT_PHOTO_LIST,
  SOBRE_VARIANT_TWO_COLUMNS_PORTRAIT,
} from "@/lib/landing-pages/variants";
import { showLpMessageError, showLpUpgradeToast } from "@/lib/toast";
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
  FieldGroupAccordion,
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
  heroDestaqueHint,
  ImagensPanel,
  ReorderPanel,
} from "./panels/layout-panel";
import { SeoPanel } from "./panels/seo-panel";
import {
  AddSectionButton,
  CustomSectionEditor,
  customSectionIcon,
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
// O painel da esquerda agora acumula navegação E os campos da seção aberta
// (mestre-detalhe), então precisa de mais largura do que quando era só o menu.
const LEFT_PANEL_DEFAULT_SIZE = "24rem";
const LEFT_PANEL_MIN_SIZE = "20rem";
const LEFT_PANEL_COLLAPSED_SIZE = "0px";
const PREVIEW_PANEL_MIN_SIZE = "26rem";

function getSectionDescription(sectionId: DetailSectionId): string {
  switch (sectionId) {
    case "identidade":
      return "Logo, tema e paleta da página";
    case "imagens":
      return "Fotos das seções e retratos da equipe";
    case "aparencia":
      return "Tipografia, botões e detalhes visuais";
    case "integracoes":
      return "Tracking, scripts e visibilidade nos buscadores";
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

/** Status da LP (publicado/rascunho). A URL pública vem do botão de olho. */
function PublicLpUrlPreview({ status }: { status: "draft" | "published" }) {
  const isLive = status === "published";

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-muted/20 px-2.5 py-1"
      title={isLive ? "Landing page publicada" : "Landing page em rascunho"}
    >
      <span className="relative flex size-1.5" aria-hidden>
        {isLive ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />
        ) : null}
        <span
          className={cn(
            "relative size-1.5 rounded-full",
            isLive ? "bg-emerald-500/70" : "bg-rose-400/55 dark:bg-rose-400/45",
          )}
        />
      </span>
      <span className="text-[10px] text-muted-foreground">
        {isLive ? "Publicado" : "Rascunho"}
      </span>
    </span>
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
  /** Nome da LP: usado ao salvar (a barra do topo mostra a URL pública). */
  name: string;
  status?: "draft" | "published";
  initialAccountConfig: GlobalConfig;
}) {
  const router = useRouter();
  const session = useSession();
  const { office, set, layout, copy } = form;
  const seoIndexable =
    copy.seo?.indexable ?? form.schema.seo?.indexable ?? false;
  const tones = layout.tones ?? DEFAULT_LAYOUT.tones;
  const previewRef = useRef<HTMLIFrameElement>(null);
  const leftPanelRef = useRef<PanelImperativeHandle>(null);
  const isLgUp = useIsLgUp();
  const [mobileTab, setMobileTab] = useState<"navigation" | "preview">(
    "navigation",
  );
  const showNavigationPanel = isLgUp || mobileTab === "navigation";
  const showPreviewPanel = isLgUp || mobileTab === "preview";
  const [viewport, setViewport] = useState<Viewport>("desktop");
  // Modal de personalização do formulário do popup de lead.
  const [builderOpen, setBuilderOpen] = useState(false);
  // Modo "Mudar sequência": colapsa tudo e mostra só as seções arrastáveis.
  const [reorderMode, setReorderMode] = useState(false);
  // Mestre-detalhe: seção aberta no painel de configuração (null = menu inicial).
  // Pode ser uma seção nativa (DetailSectionId) OU o id de uma seção
  // personalizada (UUID) — ambos abrem no mesmo painel de detalhe.
  const [detailSection, setDetailSection] = useState<string | null>(null);
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
  // Accordions da navegação. "Seções principais" (o trabalho do dia a dia) abre
  // por padrão; os demais começam recolhidos para reduzir ruído.
  const [mainOpen, setMainOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  // Largura real (px) do painel de navegação — a coluna do status na barra de
  // topo copia esse valor para a divisória cair EXATAMENTE na borda dos painéis,
  // mesmo quando o usuário redimensiona. Default = 24rem (LEFT_PANEL_DEFAULT_SIZE).
  const [navPanelPx, setNavPanelPx] = useState(384);
  // Esconde a barra do topo para ver a LP limpa (só no desktop).
  const [topBarHidden, setTopBarHidden] = useState(false);

  // Esconder a navegação do editor é o gesto "quero a tela inteira para o
  // preview" — e a trilha de ícones do app faz parte dessa tela. Sincronizamos
  // pelo estado (e não dentro do clique) para valer também quando o usuário
  // arrasta a divisória até fechar o painel.
  const { setSidebarHidden } = useAppChrome();
  useEffect(() => {
    setSidebarHidden(leftPanelCollapsed);
  }, [leftPanelCollapsed, setSidebarHidden]);

  // A sidebar é GLOBAL: se o editor desmontar com ela escondida, o resto do app
  // fica sem navegação e sem nenhum controle para trazê-la de volta.
  useEffect(() => {
    return () => setSidebarHidden(false);
  }, [setSidebarHidden]);
  const isPublishing = publishState === "saving";
  const lawyerCount = office.lawyers?.length ?? 0;

  const needsMetrics = layout.hero === HERO_VARIANT_STATS_AUTHORITY;

  // A faixa de destaques na base da seção é exclusiva do Topo "Com métricas".
  const needsBand = layout.hero === HERO_VARIANT_STATS_AUTHORITY;

  // O vídeo não mora mais no Topo: ele vive na sua própria seção, logo abaixo
  // (Adicionar seção → Vídeo). Todas as variantes do Topo ficam disponíveis.
  const heroOptions = HERO_OPTIONS;

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

  useEffect(() => {
    if (!seoIndexable && detailSection === "seo") {
      setDetailSection(null);
    }
  }, [seoIndexable, detailSection]);

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
        enabled: seoIndexable,
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
  }, [layout, seoIndexable]);

  const currentDetail =
    detailSection === null
      ? null
      : (editorSections.find((section) => section.id === detailSection) ??
        null);
  // Seção personalizada aberta no detalhe (quando não é uma seção nativa).
  const currentCustom =
    detailSection && !isDetailSectionId(detailSection)
      ? (form.customSections.find((s) => s.id === detailSection) ?? null)
      : null;
  const detailLabel =
    currentDetail?.label ??
    (currentCustom
      ? currentCustom.title.trim() || "Nova seção"
      : "Campos editáveis");
  const resourceSections = editorSections.filter(
    (section) => section.stage === "foundation",
  );
  const contentSections = editorSections.filter(
    (section) => section.stage === "content",
  );
  const conversionSections = editorSections.filter(
    (section) => section.stage === "conversion",
  );
  const syncDetailSectionUrl = useCallback((id: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("sec", id);
    else url.searchParams.delete("sec");
    const next = `${url.pathname}${url.search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", next);
    }
  }, []);

  // Se a seção personalizada aberta no detalhe for excluída, volta para a lista.
  useEffect(() => {
    if (
      detailSection &&
      !isDetailSectionId(detailSection) &&
      !form.customSections.some((s) => s.id === detailSection)
    ) {
      setDetailSection(null);
      syncDetailSectionUrl(null);
    }
  }, [detailSection, form.customSections, syncDetailSectionUrl]);
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

  function goToDetailSection(id: string) {
    setDetailSection(id);
    syncDetailSectionUrl(id);
    // Os campos abrem no próprio painel da esquerda (mestre-detalhe).
    if (!isLgUp) setMobileTab("navigation");
    const target =
      editorSections.find((s) => s.id === id)?.previewTarget ??
      (isDetailSectionId(id) ? `sec-${id}` : `sec-custom-${id}`);
    scrollToSection(target);
  }

  /** Volta do formulário da seção para a lista de navegação. */
  function closeDetailSection() {
    setDetailSection(null);
    syncDetailSectionUrl(null);
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
          showLpUpgradeToast(session);
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
        if (isAccessDeniedError(res.error)) showLpUpgradeToast(session);
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
          showLpUpgradeToast(session);
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
        return <Storefront size={22} />;
      case "imagens":
        return <Image size={22} />;
      case "aparencia":
        return <Tune size={22} />;
      case "integracoes":
        return <Campaign size={22} />;
      case "seo":
        return <Search size={22} />;
      case "hero":
        return <Web size={22} />;
      case "dor":
        return <SentimentDissatisfied size={22} />;
      case "solucao":
        return <Lightbulb size={22} />;
      case "sobre":
        return <Badge size={22} />;
      case "equipe":
        return <Groups size={22} />;
      case "areas":
        return <Gavel size={22} />;
      case "etapas":
        return <FormatListNumbered size={22} />;
      case "faq":
        return <Help size={22} />;
      case "ctaFinal":
        return <Campaign size={22} />;
      case "footer":
        return <ContactPage size={22} />;
    }
  }

  // Agrupa seletor de layout + tom de fundo num único cartão nativo, em vez
  // de dois controles soltos flutuando no painel.
  /**
   * Ajustes da seção no painel. O seletor de LAYOUT saiu daqui — ele já existe
   * flutuando sobre a própria seção no preview, então duplicá-lo aqui só
   * ocupava espaço.
   */
  function renderSectionSettings(tone?: {
    value: Tone;
    onChange: (t: Tone) => void;
  }) {
    if (!tone) return null;
    return (
      <div className="rounded-xl border border-border bg-background px-4">
        <div className="py-3">
          <ToneToggle value={tone.value} onChange={tone.onChange} />
        </div>
      </div>
    );
  }

  function renderNavigationGroup({
    step,
    title,
    sections,
    collapsible,
    open,
    onToggle,
    headerless,
  }: {
    step: string;
    title: string;
    sections: WorkspaceSectionMeta[];
    collapsible?: boolean;
    open?: boolean;
    onToggle?: () => void;
    /** Sem cabeçalho próprio — o título/estado vêm da faixa acima. */
    headerless?: boolean;
  }) {
    const expanded = headerless ? true : collapsible ? !!open : true;
    const headerInner = (
      <>
        <div className="flex min-w-0 items-center gap-2">
          {collapsible ? (
            <KeyboardArrowDown
              size={16}
              className={cn(
                "shrink-0 text-muted-foreground transition-transform",
                expanded ? "" : "-rotate-90",
              )}
            />
          ) : (
            <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
              {step}
            </span>
          )}
          <p className="truncate text-xs font-medium text-foreground">
            {title}
          </p>
        </div>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {sections.length}
        </span>
      </>
    );
    return (
      <section className="space-y-1.5">
        {headerless ? null : collapsible ? (
          // py-2.5 iguala a altura das linhas de seção logo abaixo: o cabeçalho
          // é clicável e antes tinha metade da altura delas, virando um alvo ruim.
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded ? "true" : "false"}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-muted/60"
          >
            {headerInner}
          </button>
        ) : (
          <div className="flex items-center justify-between gap-2 px-2.5 py-2.5">
            {headerInner}
          </div>
        )}
        <div className={cn("space-y-0.5", expanded ? "" : "hidden")}>
          {sections.map((section) => (
            <EditorSectionMenuRow
              key={section.id}
              title={section.label}
              icon={
                <span
                  className={cn(
                    // size-10 + ícone 22: mesmo tamanho do ícone da "Nova seção".
                    "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-[#808c97]/10 bg-card",
                    section.enabled ? "text-[#808c97]" : "text-[#808c97]/50",
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

  /** Cabeçalho-faixa dos grupos da navegação: borda inferior, caixa alta e seta.
   *  Estilo único para "Seções principais", "Recursos" e "Personalizadas". */
  function renderStripHeader({
    title,
    subtitle,
    count,
    open,
    onToggle,
  }: {
    title: string;
    subtitle?: string;
    count?: number;
    open: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open ? "true" : "false"}
        className="flex w-full items-center justify-between gap-2 border-b border-border px-3 py-2.5 text-left transition hover:bg-muted/40"
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium leading-[22px] text-[#0f1828] dark:text-foreground">
            {title}
          </span>
          {subtitle ? (
            <span className="block text-[11px] text-muted-foreground">
              {subtitle}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {typeof count === "number" ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {count}
            </span>
          ) : null}
          <KeyboardArrowDown
            size={18}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              open ? "" : "-rotate-90",
            )}
          />
        </span>
      </button>
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
      {detailSection ? (
        /* Detalhe: campos da seção aberta, no lugar da lista. */
        <>
          <div className="border-b border-border px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-1 h-7 shrink-0 px-1.5 text-xs"
                onClick={closeDetailSection}
              >
                <ArrowBack size={16} />
                Voltar
              </Button>
              {/* Título e badges empurrados para a direita da barra. */}
              <p className="ml-auto min-w-0 truncate text-sm font-semibold text-foreground">
                {detailLabel}
              </p>
              {currentDetail?.variantLabel ? (
                <UiBadge variant="secondary" className="shrink-0">
                  {currentDetail.variantLabel}
                </UiBadge>
              ) : null}
              {(currentDetail && !currentDetail.enabled) ||
              currentCustom?.hidden ? (
                <UiBadge variant="muted" className="shrink-0">
                  Oculta na página
                </UiBadge>
              ) : null}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            {renderDetailContent()}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {reorderMode ? (
            <div className="px-3 py-3">
              <ReorderPanel form={form} onClose={() => setReorderMode(false)} />
            </div>
          ) : (
            <>
              {/* As três faixas usam o MESMO estilo (renderStripHeader): borda
                    inferior de ponta a ponta, caixa alta e seta. As linhas de cada
                    grupo ficam abaixo, recuadas, quando ele está aberto. */}
              {renderStripHeader({
                title: "Seções principais",
                subtitle: "Clique em um item para editar aqui.",
                open: mainOpen,
                onToggle: () => setMainOpen((v) => !v),
              })}
              {mainOpen ? (
                // px-0.5 soma com o px-2.5 interno do row e alinha o ícone com o
                // texto do cabeçalho (px-3 = 12px).
                <div className="px-0.5 py-2">
                  {renderNavigationGroup({
                    step: "1",
                    title: "Seções principais",
                    sections: [...contentSections, ...conversionSections],
                    headerless: true,
                  })}
                </div>
              ) : null}

              {renderStripHeader({
                title: "Recursos da página",
                subtitle: "Configurações avançadas da página.",
                open: resourcesOpen,
                onToggle: () => setResourcesOpen((v) => !v),
              })}
              {resourcesOpen ? (
                <div className="px-0.5 py-2">
                  {renderNavigationGroup({
                    step: "2",
                    title: "Recursos da página",
                    sections: resourceSections,
                    headerless: true,
                  })}
                </div>
              ) : null}

              {renderStripHeader({
                title: "Seções personalizadas",
                subtitle: "Crie novas seções.",
                count: form.customSections.length,
                open: customOpen,
                onToggle: () => setCustomOpen((v) => !v),
              })}
              {customOpen ? (
                <div className="space-y-2 px-3 py-2">
                  <div className="flex justify-end">
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
                        <EditorSectionMenuRow
                          key={sec.id}
                          title={sec.title.trim() || "Nova seção"}
                          icon={
                            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-[#808c97]/10 bg-card text-[#808c97]">
                              {customSectionIcon(sec.kind)}
                            </span>
                          }
                          toggle={{
                            on: !sec.hidden,
                            onChange: (on) => form.setCustomHidden(sec.id, !on),
                          }}
                          active={detailSection === sec.id}
                          onPress={() => goToDetailSection(sec.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background px-3 py-3 text-xs text-muted-foreground">
                      Nenhuma seção personalizada adicionada.
                    </div>
                  )}

                  <AddSectionButton onAdd={form.addCustomSection} />
                </div>
              ) : null}

              {editorNotices.length ? (
                <div className="px-3 py-3">
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
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </aside>
  );

  const previewPanel = (
    <main
      className={cn(
        "relative min-h-0 flex-col overflow-hidden border-border bg-card",
        isLgUp
          ? "flex h-full min-w-0 border-r"
          : showPreviewPanel
            ? "flex border-b"
            : "hidden border-b",
      )}
    >
      {/* Colapsar/expandir a navegação: fica na divisória, no meio do editor. */}
      {isLgUp ? (
        <button
          type="button"
          onClick={toggleLeftPanel}
          title={
            leftPanelCollapsed ? "Mostrar navegação" : "Esconder navegação"
          }
          className="absolute left-0 top-1/2 z-20 flex h-12 w-5 -translate-y-1/2 items-center justify-center rounded-r-md border border-l-0 border-border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
        >
          {leftPanelCollapsed ? (
            <KeyboardArrowRight size={16} />
          ) : (
            <KeyboardArrowLeft size={16} />
          )}
          <span className="sr-only">
            {leftPanelCollapsed ? "Mostrar navegação" : "Esconder navegação"}
          </span>
        </button>
      ) : null}

      {/* Esconder/mostrar a barra do topo: pendurado na borda superior. */}
      {isLgUp ? (
        <button
          type="button"
          onClick={() => setTopBarHidden((v) => !v)}
          title={
            topBarHidden ? "Mostrar barra do topo" : "Esconder barra do topo"
          }
          className="absolute left-1/2 top-0 z-20 flex h-5 w-12 -translate-x-1/2 items-center justify-center rounded-b-md border border-t-0 border-border bg-background text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
        >
          {topBarHidden ? (
            <KeyboardArrowDown size={16} />
          ) : (
            <KeyboardArrowUp size={16} />
          )}
          <span className="sr-only">
            {topBarHidden ? "Mostrar barra do topo" : "Esconder barra do topo"}
          </span>
        </button>
      ) : null}

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

  /* Campos da seção aberta. Renderizado dentro do painel da esquerda
     (mestre-detalhe) — não existe mais painel de CMS à direita. */
  function renderDetailContent() {
    // Seção personalizada: os mesmos campos do editor, sem o accordion (bare).
    if (currentCustom) {
      return (
        <div className="min-w-0 max-w-full space-y-3">
          <CustomSectionEditor
            form={form}
            section={currentCustom}
            bare
            onScroll={() => scrollToSection(`sec-custom-${currentCustom.id}`)}
          />
        </div>
      );
    }
    return (
      <div className="min-w-0 max-w-full space-y-3">
        {detailSection === "identidade" && <IdentidadePanel form={form} />}
        {detailSection === "imagens" && <ImagensPanel form={form} />}
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
            {renderSectionSettings({
              value: tones.hero ?? "light",
              onChange: (t) => form.setTone("hero", t),
            })}
            {/* As duas imagens do topo ficam aqui, juntas: a cena ao fundo e a
                figura à direita. Antes só o fundo estava nesta tela, e a figura
                vivia no painel Imagens — ninguém achava. */}
            <SectionImageInput
              form={form}
              sectionKey="hero"
              label="Fundo do topo"
            />
            <SectionImageInput
              form={form}
              sectionKey="heroDestaque"
              label="Destaque do topo"
            />
            <p className="-mt-1 px-0.5 text-xs text-muted-foreground">
              {heroDestaqueHint(form.office)}
            </p>
            <FieldGroup title="Textos">
              <HeroTexts form={form} />
            </FieldGroup>
            {/* Métricas e faixa são exclusivas: preencher a faixa esconde as
                métricas (elas não renderizariam mesmo). */}
            {needsMetrics && !hasExplicitHeroBand(form.office) ? (
              <FieldGroupAccordion
                title="Métricas"
                hint="Números de destaque exibidos no topo. Indisponível enquanto houver faixa de destaques."
              >
                <MetricsInput form={form} />
              </FieldGroupAccordion>
            ) : null}
            {needsBand ? (
              <FieldGroupAccordion
                title="Faixa de destaques"
                hint="Itens em caixa alta na base do topo (2 a 4)"
              >
                <HeroFeaturesInput form={form} />
              </FieldGroupAccordion>
            ) : null}
          </>
        )}
        {detailSection === "aparencia" && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">
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

            <div className="space-y-2 border-t border-border/60 pt-3">
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
                <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                  Os botões abrem o WhatsApp informado no{" "}
                  <strong>Rodapé</strong>.
                </p>
              ) : (
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Abre um formulário que termina sempre com{" "}
                    <strong>nome</strong> e <strong>telefone</strong>. Adicione
                    perguntas personalizadas (texto, e-mail, valor, CEP, etc.)
                    antes desse passo.
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

            <div className="space-y-2 border-t border-border/60 pt-3">
              <p className="text-sm font-medium text-foreground">Tipografia</p>
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
            {renderSectionSettings({
              value: tones.dor,
              onChange: (t) => form.setTone("dor", t),
            })}
            <SectionImageInput form={form} sectionKey="dor" />
            <FieldGroup title="Textos">
              <DorTexts form={form} />
            </FieldGroup>
            <FieldGroupAccordion
              title="Cards"
              hint="As dores exibidas na seção"
            >
              <DorCards form={form} />
            </FieldGroupAccordion>
          </>
        )}
        {detailSection === "solucao" && (
          <>
            {renderSectionSettings({
              value: tones.solucao,
              onChange: (t) => form.setTone("solucao", t),
            })}
            <SectionImageInput form={form} sectionKey="solucao" />
            <FieldGroup title="Textos">
              <SolucaoTexts form={form} />
            </FieldGroup>
            <FieldGroupAccordion
              title="Cards"
              hint="As etapas de como você ajuda"
            >
              <SolucaoCards form={form} />
            </FieldGroupAccordion>
          </>
        )}
        {detailSection === "sobre" && (
          <>
            {renderSectionSettings({
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
              <FieldGroupAccordion
                title="Diferenciais"
                hint="Pontos fortes listados no Sobre"
              >
                <DiferenciaisInput form={form} />
              </FieldGroupAccordion>
            ) : null}
          </>
        )}
        {detailSection === "equipe" && (
          <>
            {renderSectionSettings(
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
            {renderSectionSettings({
              value: tones.areas,
              onChange: (t) => form.setTone("areas", t),
            })}
            <FieldGroup title="Textos">
              <AreasTexts form={form} />
            </FieldGroup>
            <FieldGroupAccordion
              title="Cards"
              hint="As áreas de atuação e seus sub-itens"
            >
              <AreasCards form={form} />
            </FieldGroupAccordion>
          </>
        )}
        {detailSection === "etapas" && (
          <>
            {renderSectionSettings({
              value: tones.etapas,
              onChange: (t) => form.setTone("etapas", t),
            })}
            <FieldGroup title="Textos">
              <EtapasTexts form={form} />
            </FieldGroup>
            <FieldGroupAccordion
              title="Passos"
              hint="O passo a passo do atendimento"
            >
              <EtapasCards form={form} />
            </FieldGroupAccordion>
          </>
        )}
        {detailSection === "faq" && (
          <>
            {renderSectionSettings({
              value: tones.faq,
              onChange: (t) => form.setTone("faq", t),
            })}
            <FieldGroup title="Textos">
              <FaqTexts form={form} />
            </FieldGroup>
            <FieldGroupAccordion
              title="Perguntas"
              hint="As dúvidas e respostas do FAQ"
            >
              <FaqPerguntas form={form} />
            </FieldGroupAccordion>
          </>
        )}
        {detailSection === "ctaFinal" && (
          <>
            {renderSectionSettings({
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
    );
  }

  return (
    <Form {...form.form}>
      {/* Altura vem do pai (AppLayout desconta a SystemBar). Fixar 100dvh aqui
          estoura o container e o overflow-hidden corta o rodapé dos painéis. */}
      <div className="app-ui flex h-full min-h-0 w-full max-w-full min-w-0 flex-col overflow-hidden bg-muted/40">
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
          description="Isso substitui o tracking e os scripts desta página pelos valores padrão da conta. Continuar?"
          confirmLabel="Restaurar"
          variant="destructive"
          onConfirm={restoreAccountDefaults}
        />
        <div
          className={cn(
            "shrink-0 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-5 lg:px-0 lg:py-0",
            // Escondida só no desktop, pelo botão da borda superior do preview.
            isLgUp && topBarHidden && "hidden",
          )}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
            {/* Coluna do status: mesma largura do painel de navegação (24rem =
                LEFT_PANEL_DEFAULT_SIZE). A borda direita continua a divisória
                dos painéis logo abaixo, e "Rascunho/Publicado" fica à esquerda. */}
            <div
              className="flex min-w-0 items-center gap-2 lg:shrink-0 lg:self-stretch lg:border-r lg:border-border lg:px-5"
              // Largura = painel de navegação, para a borda cair na divisória.
              style={isLgUp ? { width: navPanelPx } : undefined}
            >
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
              <div className="ml-auto min-w-0">
                <PublicLpUrlPreview status={status} />
              </div>
            </div>

            {/* Sobre o preview: seletor de viewport (centralizado) + ações.
                O py-3 vive aqui (a barra ficou lg:py-0) para a coluna do status
                — e a borda dela — esticarem de ponta a ponta. */}
            <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center lg:gap-4 lg:px-5 lg:py-3">
              <div className="flex min-w-0 items-center lg:flex-1 lg:justify-center">
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
                      aria-label={label}
                      title={label}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md px-2 py-1 transition",
                        viewport === id
                          ? "bg-ui-soft text-ui"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
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
                  // Publicada: tirar do ar e espiar o que está no ar são ações
                  // irmãs — ficam num grupo só, com o olho abrindo a página real.
                  <ButtonGroup>
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-label="Ver página publicada"
                      title="Abrir a página publicada em nova aba"
                      asChild
                    >
                      <a
                        href={publicLpUrl(officeSubdomain, slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Visibility size={16} />
                      </a>
                    </Button>
                  </ButtonGroup>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={publicar}
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <ProgressActivity size={16} className="animate-spin" />
                    ) : null}
                    Publicar
                  </Button>
                )}
              </div>
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
              onResize={(panelSize) => {
                setLeftPanelCollapsed(
                  panelSize.inPixels <= PANEL_COLLAPSED_THRESHOLD_PX,
                );
                setNavPanelPx(panelSize.inPixels);
              }}
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
          </ResizablePanelGroup>
        ) : (
          <div className="min-h-0 flex-1">
            {navigationPanel}
            {previewPanel}
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
          </nav>
        ) : null}

        {builderOpen ? (
          <PopupBuilder form={form} onClose={() => setBuilderOpen(false)} />
        ) : null}
      </div>
    </Form>
  );
}
