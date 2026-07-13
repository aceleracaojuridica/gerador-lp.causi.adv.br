import "server-only";

/** Carrega sharp sob demanda para não quebrar rotas que não processam imagem. */
async function loadSharp() {
  const mod = await import("sharp");
  return mod.default;
}

/** Redimensiona e converte imagem para WebP otimizado. */
export async function optimizeImage(buffer: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
}> {
  const sharp = await loadSharp();
  const pipeline = sharp(buffer).rotate().resize({
    width: 2400,
    height: 2400,
    fit: "inside",
    withoutEnlargement: true,
  });
  const output = await pipeline.webp({ quality: 85 }).toBuffer();
  const meta = await sharp(output).metadata();
  return {
    buffer: output,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}
