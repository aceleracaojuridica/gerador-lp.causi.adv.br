import "server-only";

/*
  Resolve imagens de cenário das seções na criação da LP:
  1. ranking IA sobre candidatos do sistema (+ galeria da conta)
  2. Unsplash ao vivo via imageQueries nos slots vazios
  3. image-bank estático só como rede de segurança
*/

import { imagensDoTema } from "./image-bank";
import type { ExternalApiLogMeta } from "./lp-external-api-log";
import {
  EMPTY_SCENE_IMAGES,
  SCENE_SECTION_KEYS,
  type SceneImages,
} from "./section-images";
import {
  pickSystemImagesWithAiRanking,
  type SystemGalleryImageItem,
} from "./system-default-images";
import { buscarImagensUnsplash } from "./unsplash";

export type ResolveSectionImagesInput = {
  apiKey: string;
  tema: string;
  paletteHint?: string;
  catalog: SystemGalleryImageItem[];
  imageQueries: Partial<SceneImages>;
  seedInput: string;
  log?: ExternalApiLogMeta;
};

/**
 * Escolhe URL por seção: sistema/conta primeiro; Unsplash nos gaps; image-bank no fim.
 */
export async function resolveSectionImages(
  input: ResolveSectionImagesInput,
): Promise<SceneImages> {
  const { apiKey, tema, paletteHint, catalog, imageQueries, seedInput, log } =
    input;

  const picked: SceneImages =
    catalog.length > 0
      ? await pickSystemImagesWithAiRanking({
          apiKey,
          theme: tema,
          paletteHint,
          catalog,
          seedInput,
          log,
        })
      : { ...EMPTY_SCENE_IMAGES };

  const gaps = SCENE_SECTION_KEYS.filter((key) => !picked[key]?.trim());
  if (gaps.length > 0) {
    const queries: Partial<SceneImages> = {};
    for (const key of gaps) {
      queries[key] = imageQueries[key] ?? "";
    }
    const fromUnsplash = await buscarImagensUnsplash(queries, log);
    for (const key of gaps) {
      if (!picked[key]?.trim() && fromUnsplash[key]?.trim()) {
        picked[key] = fromUnsplash[key];
      }
    }
  }

  const bank = imagensDoTema(tema);
  return {
    hero: picked.hero || bank.hero,
    dor: picked.dor || bank.dor,
    sobre: picked.sobre || bank.sobre,
    solucao: picked.solucao || bank.solucao,
  };
}
