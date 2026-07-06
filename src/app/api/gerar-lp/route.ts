import { buildSchema, type FocoCopy } from "@/lib/landing-pages/focos";
import { imagensDoTema } from "@/lib/landing-pages/image-bank";
import { callOpenAiForCopy } from "@/lib/landing-pages/lp-generate-copy";
import {
  isLpSlugTaken,
  resolveOfficeSubdomain,
  saveLp,
} from "@/lib/landing-pages/lp-store";
import {
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  type Layout,
  type Theme,
} from "@/lib/landing-pages/schema";
import { normalizeSeo } from "@/lib/landing-pages/seo";
import {
  buildOfficeFromGerarLpPayload,
  type GerarLpPayload,
} from "@/lib/landing-pages/shared/create-seed";
import {
  allocateUniqueLpSlug,
  slugFromOfficeName,
} from "@/lib/landing-pages/slug";
import { buscarImagensUnsplash } from "@/lib/landing-pages/unsplash";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";

/*
  Gera a LP COMPLETA a partir do cadastro do front (self-service): escreve a
  copy (OpenAI), busca as imagens de cenário (Unsplash), monta o LpSchema e
  salva no banco. Devolve o slug para o front abrir a LP.

  Aceita copy e images pré-gerados (vindos de /api/gerar-copy) para evitar
  chamadas duplas ao OpenAI/Unsplash quando o wizard já fez o preview.
  Aceita layout explícito (variantes iniciais copiadas de um preset no wizard).
*/
export const runtime = "nodejs";

type Payload = Partial<GerarLpPayload>;

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

  const name = (p.name ?? "").trim();
  const tema = (p.tema ?? "").trim();
  if (!name || !tema) {
    return Response.json(
      { error: "Informe ao menos o nome do escritório e o tema." },
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

  // 1. Copy: usa pré-gerada (do /api/gerar-copy) ou chama a IA agora
  let copy: FocoCopy;
  let imageQueries: Record<string, string> = {};
  if (p.copy) {
    copy = p.copy;
  } else {
    try {
      const result = await callOpenAiForCopy(apiKey, {
        name,
        tema,
        city: (p.city ?? "").trim() || undefined,
        about: (p.about ?? "").trim() || undefined,
        diferenciais: p.diferenciais?.filter(Boolean),
      });
      copy = result.copy;
      imageQueries = result.imageQueries;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar a copy.";
      return Response.json({ error: msg }, { status: 502 });
    }
  }

  // 2. Imagens: usa pré-geradas ou busca agora
  let images: { hero: string; dor: string; sobre: string; solucao: string };
  if (p.images) {
    images = p.images;
  } else {
    const live = await buscarImagensUnsplash(imageQueries);
    const bank = imagensDoTema(tema);
    images = {
      hero: live.hero || bank.hero,
      dor: live.dor || bank.dor,
      sobre: live.sobre || bank.sobre,
      solucao: live.solucao || bank.solucao,
    };
  }

  // 3. Monta office + schema
  const theme: Theme = p.theme ?? DEFAULT_THEME;
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
      layout: p.layout ?? DEFAULT_LAYOUT,
    },
    images,
  );

  const videoId = (p.videoId ?? "").trim();

  // Layout: preset escolhido no wizard (só variantes) ou DEFAULT_LAYOUT; vídeo força hero "video"
  const layout: Layout = p.layout
    ? { ...p.layout, hero: videoId ? "video" : p.layout.hero }
    : { ...DEFAULT_LAYOUT, hero: videoId ? "video" : DEFAULT_LAYOUT.hero };

  const schema = buildSchema(
    office,
    theme,
    tema,
    layout,
    videoId || undefined,
    copy,
  );
  schema.seo = normalizeSeo(
    {
      ...copy.seo,
      ogImage: images.hero,
      favicon: p.logoSrc ?? "",
    },
    schema,
    tema,
  );

  // 4. Salva e devolve o slug
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
    const msg = err instanceof Error ? err.message : "Erro ao salvar a LP.";
    return Response.json({ error: msg }, { status: 500 });
  }
}
