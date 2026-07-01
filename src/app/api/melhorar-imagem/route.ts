import sharp from "sharp";
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
  const match = image.match(
    /^data:(image\/(?:png|jpe?g|webp));base64,([\s\S]+)$/,
  );
  if (!match) {
    return Response.json(
      { error: "Imagem inválida. Envie um PNG, JPG ou WEBP." },
      { status: 400 },
    );
  }

  try {
    const input = Buffer.from(match[2], "base64");
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
