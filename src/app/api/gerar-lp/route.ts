import { buildSchema, type FocoCopy } from "@/lib/landing-pages/focos";
import { loadAccountLpExamplesForPrompt } from "@/lib/landing-pages/lp-account-generation-context";
import { callOpenAiForCopy } from "@/lib/landing-pages/lp-generate-copy";
import { chooseLayoutWithAi } from "@/lib/landing-pages/lp-generate-layout";
import {
  isLpSlugTaken,
  resolveOfficeSubdomain,
  saveLp,
} from "@/lib/landing-pages/lp-store";
import { resolveSectionImages } from "@/lib/landing-pages/resolve-section-images";
import {
  DEFAULT_THEME,
  type Layout,
  type Theme,
} from "@/lib/landing-pages/schema";
import type { SceneImages } from "@/lib/landing-pages/section-images";
import { normalizeSeo } from "@/lib/landing-pages/seo";
import {
  buildOfficeFromGerarLpPayload,
  type GerarLpPayload,
} from "@/lib/landing-pages/shared/create-seed";
import {
  allocateUniqueLpSlug,
  slugFromOfficeName,
} from "@/lib/landing-pages/slug";
import {
  describeThemeMood,
  listAccountImagesForRanking,
  listSystemGalleryImages,
} from "@/lib/landing-pages/system-default-images";
import {
  buildVideoSection,
  orderWithVideoFirst,
} from "@/lib/landing-pages/video-section";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

/*
  Gera a LP COMPLETA a partir do cadastro do front (self-service): escreve a
  copy (OpenAI), resolve as imagens de cenário, monta o LpSchema e
  salva no banco. Devolve o slug para o front abrir a LP.

  Aceita copy e images pré-gerados (vindos de /api/gerar-copy) para evitar
  chamadas duplas ao OpenAI quando o wizard já fez o preview.
  Aceita layout explícito (variantes iniciais da IA no wizard).
*/
export const runtime = "nodejs";

type Payload = Partial<GerarLpPayload>;

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === "object" &&
    "message" in err &&
    typeof err.message === "string"
  ) {
    return err.message;
  }
  return "Erro ao salvar a LP.";
}

export async function POST(request: Request) {
  let user: Session;
  try {
    user = await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return Response.json(
      { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
      { status: forbidden ? 403 : 401 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY não configurada no servidor (.env.local)." },
      { status: 503 },
    );
  }

  let p: Payload;
  try {
    p = (await request.json()) as Payload;
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const name = (p.name ?? "").trim() || user.account.name;
  const tema = (p.tema ?? "").trim();
  if (!name || !tema) {
    return Response.json(
      { error: "Informe ao menos o tema da página." },
      { status: 400 },
    );
  }

  const slugBase = slugFromOfficeName(tema);
  if (!slugBase) {
    return Response.json(
      { error: "Tema inválido para gerar o identificador." },
      { status: 400 },
    );
  }

  const slug = await allocateUniqueLpSlug(slugBase, (s) =>
    isLpSlugTaken(user, s),
  );
  if (!slug) {
    return Response.json(
      {
        error:
          "Não foi possível gerar um identificador único. Tente um nome diferente.",
      },
      { status: 409 },
    );
  }

  const needsAiGeneration = !p.copy || !p.layout || !p.images;
  const lpCtx = sessionToLpContext(user);
  const log = {
    action: "CREATE",
    context: "create_landing_page",
    accountId: lpCtx.accountId,
    createdByUserId: lpCtx.userId,
  };

  let accountExamples = "";
  if (needsAiGeneration) {
    try {
      accountExamples = await loadAccountLpExamplesForPrompt(user, tema);
    } catch (err) {
      console.error("[gerar-lp] falha ao carregar portfólio da conta:", err);
    }
  }

  let copy: FocoCopy;
  let imageQueries: SceneImages = {
    hero: "",
    dor: "",
    sobre: "",
    solucao: "",
  };

  if (p.copy) {
    copy = p.copy;
  } else {
    try {
      const result = await callOpenAiForCopy(
        apiKey,
        {
          name,
          tema,
          city: (p.city ?? "").trim() || undefined,
          about: (p.about ?? "").trim() || undefined,
          diferenciais: p.diferenciais?.filter(Boolean),
          accountExamples: accountExamples || undefined,
        },
        log,
      );
      copy = result.copy;
      imageQueries = result.imageQueries;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar a copy.";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  const theme: Theme = p.theme ?? DEFAULT_THEME;
  const videoId = (p.videoId ?? "").trim();
  const lawyerCount = (p.lawyers ?? []).filter((l) => l.photo?.trim()).length;

  let baseLayout: Layout;
  if (p.layout) {
    baseLayout = p.layout;
  } else {
    const chosenLayout = await chooseLayoutWithAi(apiKey, {
      tema,
      about: (p.about ?? "").trim() || undefined,
      theme,
      lawyerCount,
      hasMetrics: Boolean(
        Array.isArray((p as { metrics?: { label?: string }[] }).metrics) &&
          (p as { metrics: { label?: string }[] }).metrics.some((m) =>
            m.label?.trim(),
          ),
      ),
      accountExamples: accountExamples || undefined,
      log,
    });
    baseLayout = chosenLayout.layout;
  }

  // O vídeo não ocupa mais o Topo: ele ganha a própria seção, logo abaixo dele
  // (ver `videoSection` mais adiante). O Topo fica livre para qualquer variante.
  const layout: Layout = { ...baseLayout };

  let images: SceneImages;
  if (p.images) {
    images = p.images;
  } else {
    const [systemCatalog, accountCatalog] = await Promise.all([
      listSystemGalleryImages(user),
      listAccountImagesForRanking(user),
    ]);
    const catalog = [...accountCatalog, ...systemCatalog];

    images = await resolveSectionImages({
      apiKey,
      tema,
      paletteHint: describeThemeMood(theme),
      catalog,
      imageQueries,
      seedInput: `${lpCtx.accountId}:${new Date().toISOString().slice(0, 16)}`,
      log,
    });
  }

  const office = buildOfficeFromGerarLpPayload(
    {
      name,
      tema,
      city: (p.city ?? "").trim(),
      whatsapp: p.whatsapp ?? "",
      whatsappDisplay: p.whatsappDisplay ?? "",
      email: (p.email ?? "").trim(),
      address: (p.address ?? "").trim(),
      mapsUrl: (p.mapsUrl ?? "").trim(),
      extraAddresses: p.extraAddresses,
      about: (p.about ?? "").trim(),
      diferenciais: (p.diferenciais ?? []).map((d) => d.trim()).filter(Boolean),
      videoId: (p.videoId ?? "").trim(),
      logoSrc: p.logoSrc ?? "",
      logoBg: p.logoBg ?? { type: "transparent", color: theme.brand },
      theme,
      lawyers: p.lawyers ?? [],
      socials: p.socials ?? [],
      copy,
      images,
      layout,
    },
    images,
  );

  const schema = buildSchema(
    office,
    theme,
    tema,
    layout,
    videoId || undefined,
    copy,
  );

  // Vídeo informado no wizard: nasce como a primeira seção do meio, logo abaixo
  // do Topo (Topo → Vídeo → Dores). Título, texto e botão são editáveis depois.
  if (videoId) {
    const videoSectionId = crypto.randomUUID();
    schema.customSections = [
      buildVideoSection(videoSectionId, videoId),
      ...(schema.customSections ?? []),
    ];
    schema.layout.order = orderWithVideoFirst(
      schema.layout.order,
      videoSectionId,
    );
  }
  schema.seo = normalizeSeo(
    {
      ...copy.seo,
      ogImage: images.hero,
      favicon: p.logoSrc ?? "",
    },
    schema,
    tema,
  );

  try {
    const officeSubdomain = await resolveOfficeSubdomain(user);
    await saveLp(user, {
      slug,
      officeSubdomain,
      name,
      tema,
      status: "draft",
      schema,
    });
    return Response.json({ ok: true, slug });
  } catch (err) {
    console.error("[gerar-lp] save failed:", err);
    return Response.json({ error: errorMessage(err) }, { status: 500 });
  }
}
