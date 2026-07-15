import { requireLpSession } from "@/lib/session";

// Endpoint que MELHORA a qualidade de uma foto de advogado SEM mudar a pessoa.
// Não usa IA generativa: é processamento de imagem (lib sharp) — aumenta a
// resolução (upscale Lanczos), reduz ruído e aplica nitidez. O rosto é o MESMO,
// pixel a pixel, só mais limpo. Sem chave de API e sem custo.

export const runtime = "nodejs";
export const maxDuration = 60;

// Não passa de ~2000px no lado maior (evita data URLs gigantes) e faz no máximo
// um upscale de 2x (acima disso o ganho some e o arquivo incha).
const MAX_SIDE = 2000;
const MAX_SCALE = 2;

function hostOf(url: string | undefined): string | null {
  try {
    return url ? new URL(url).host : null;
  } catch {
    return null;
  }
}

/**
 * Hosts de onde o servidor aceita BAIXAR uma imagem.
 *
 * A allowlist não é decorativa: a URL vem do cliente, então um `fetch` livre
 * transformaria este endpoint num proxy de requisições internas (SSRF).
 */
const ALLOWED_HOSTS = new Set(
  [hostOf(process.env.LP_SUPABASE_URL), "images.unsplash.com"].filter(
    (h): h is string => Boolean(h),
  ),
);

/**
 * A foto pode chegar como data URL (upload recém-feito, ainda não persistido) ou
 * como URL pública do Storage (LP já salva — o caso normal no editor).
 */
async function readImageBytes(
  source: string,
): Promise<{ ok: true; bytes: Buffer } | { ok: false; error: string }> {
  const dataUrl = source.match(
    /^data:(?:image\/(?:png|jpe?g|webp));base64,([\s\S]+)$/,
  );
  if (dataUrl) {
    return { ok: true, bytes: Buffer.from(dataUrl[1], "base64") };
  }

  if (/^https?:\/\//i.test(source)) {
    const host = hostOf(source);
    if (!host || !ALLOWED_HOSTS.has(host)) {
      return { ok: false, error: "Origem da imagem não permitida." };
    }
    try {
      const res = await fetch(source, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        return {
          ok: false,
          error: `Falha ao baixar a imagem (${res.status}).`,
        };
      }
      return { ok: true, bytes: Buffer.from(await res.arrayBuffer()) };
    } catch {
      return { ok: false, error: "Falha ao baixar a imagem." };
    }
  }

  return { ok: false, error: "Imagem inválida. Envie um PNG, JPG ou WEBP." };
}

export async function POST(request: Request) {
  try {
    await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return Response.json(
      { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
      { status: forbidden ? 403 : 401 },
    );
  }

  let body: { image?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const image = (body.image ?? "").trim();
  const source = await readImageBytes(image);
  if (!source.ok) {
    return Response.json({ error: source.error }, { status: 400 });
  }

  try {
    const sharp = (await import("sharp")).default;
    const input = source.bytes;
    const meta = await sharp(input).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    if (!w || !h) {
      return Response.json(
        { error: "Não foi possível ler a imagem." },
        { status: 400 },
      );
    }

    const longest = Math.max(w, h);
    const scale = Math.min(MAX_SCALE, MAX_SIDE / longest);
    const targetW = Math.max(w, Math.round(w * scale));
    const targetH = Math.max(h, Math.round(h * scale));

    const out = await sharp(input)
      .rotate() // respeita a orientação da câmera (EXIF)
      .median(1) // suaviza ruído leve antes de ampliar
      .resize(targetW, targetH, { kernel: "lanczos3" })
      .sharpen({ sigma: 1.4 }) // recupera nitidez perdida no upscale
      .modulate({ saturation: 1.06, brightness: 1.02 }) // leve "vida" na cor
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    const outMeta = await sharp(out).metadata();

    return Response.json({
      image: `data:image/jpeg;base64,${out.toString("base64")}`,
      before: { width: w, height: h },
      after: {
        width: outMeta.width ?? targetW,
        height: outMeta.height ?? targetH,
      },
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Erro ao processar a imagem.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
