/*
  A seção de vídeo é uma seção personalizada do tipo "youtube" que vive logo
  abaixo do Topo — a sequência é Topo → Vídeo → Dores. Antes o vídeo também podia
  ocupar o Topo (variante `causi_lp_section_hero_video_embedded`); essa opção foi
  aposentada e as LPs antigas migram para cá (ver `migrate` em lp-store.ts).
*/
import type { CustomSection } from "./schema";

/** Seção de vídeo recém-criada: só o player, pronta para receber título/texto/botão. */
export function buildVideoSection(
  id: string,
  youtubeId: string,
): CustomSection {
  return {
    id,
    kind: "youtube",
    tone: "light",
    eyebrow: "",
    title: "Vídeo",
    text: "",
    cards: [],
    youtubeId,
    variant: "boxed",
    cta: "",
  };
}

/**
 * Põe a seção de vídeo na frente da ordem das seções do meio, para ela cair
 * logo abaixo do Topo. O filtro evita duplicar a chave se ela já estiver lá.
 */
export function orderWithVideoFirst(
  order: string[] | undefined,
  id: string,
): string[] {
  const key = `custom:${id}`;
  return [key, ...(order ?? []).filter((item) => item !== key)];
}
