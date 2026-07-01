// Chama o endpoint /api/melhorar-imagem e devolve a foto aprimorada (data URL)
// junto das dimensões antes/depois (para mostrar o ganho de resolução na UI).
// Lança Error com mensagem amigável em caso de falha.

export type Dim = { width: number; height: number };
export type ImagemMelhorada = { image: string; before: Dim; after: Dim };

export async function melhorarImagem(image: string): Promise<ImagemMelhorada> {
  const res = await fetch("/api/melhorar-imagem", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  const data = (await res
    .json()
    .catch(() => ({}))) as Partial<ImagemMelhorada> & {
    error?: string;
  };
  if (!res.ok || !data.image || !data.before || !data.after) {
    throw new Error(data.error || "Não foi possível melhorar a imagem.");
  }
  return { image: data.image, before: data.before, after: data.after };
}
