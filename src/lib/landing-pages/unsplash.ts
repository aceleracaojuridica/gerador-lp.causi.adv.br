import "server-only";

/*
  Busca de imagens temáticas na Unsplash (server-only).

  Usada pelo endpoint de geração para preencher as imagens de CENÁRIO de cada
  seção (fundo do hero, cena da dor, "escritório" no Sobre) com fotos REAIS e
  relacionadas ao tema. As fotos de PESSOAS (advogados) NÃO vêm daqui — são
  enviadas no cadastro (office.lawyerPhotos).

  Requer UNSPLASH_ACCESS_KEY (chave gratuita: https://unsplash.com/developers).
  Sem a chave, devolve strings vazias e a seção fica no bloco da cor da marca.
*/

export type SectionImages = {
  hero: string;
  dor: string;
  sobre: string;
  solucao: string;
};

export const EMPTY_SECTION_IMAGES: SectionImages = {
  hero: "",
  dor: "",
  sobre: "",
  solucao: "",
};

// Consultas-base (inglês) quando a IA não sugere termos.
const FALLBACK_QUERIES: SectionImages = {
  hero: "worried person reading legal documents at home",
  dor: "stressed person with papers financial problem",
  sobre: "modern law office interior professional meeting room",
  solucao: "lawyer consulting client at desk professional",
};

async function buscarUma(query: string, accessKey: string): Promise<string> {
  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&per_page=10&content_filter=high";

  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });
  if (!res.ok) return "";

  const data = (await res.json()) as {
    results?: { urls?: { regular?: string } }[];
  };
  const results = data.results ?? [];
  if (!results.length) return "";
  // Pega aleatoriamente entre os primeiros resultados para maior variedade
  const pick = results[Math.floor(Math.random() * results.length)];
  return pick?.urls?.regular ?? "";
}

/**
 * Busca uma imagem ALEATÓRIA entre os resultados da consulta (cada chamada
 * tende a trazer uma diferente). Vazio se não houver chave ou resultado.
 * Usada pelo botão "IA escolhe" do editor.
 */
export async function buscarUmaImagem(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return "";
  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&per_page=24&content_filter=high";
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    });
    if (!res.ok) return "";
    const data = (await res.json()) as {
      results?: { urls?: { regular?: string } }[];
    };
    const results = data.results ?? [];
    if (!results.length) return "";
    const pick = results[Math.floor(Math.random() * results.length)];
    return pick?.urls?.regular ?? "";
  } catch {
    return "";
  }
}

/**
 * Busca uma imagem aleatória usando o endpoint /photos/random da Unsplash.
 * Cada chamada retorna uma foto diferente — ideal para o botão "IA escolhe"
 * no editor, onde queremos variação garantida sem repetição.
 */
export async function buscarImagemAleatoria(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return "";

  const url =
    "https://api.unsplash.com/photos/random" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&content_filter=high&count=1";

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    });

    console.log("[unsplash/random] status:", res.status, "query:", query);

    if (!res.ok) {
      console.log("[unsplash/random] erro:", await res.text());
      return "";
    }

    const data = (await res.json()) as { urls?: { regular?: string } }[];
    const photo = Array.isArray(data) ? data[0] : data;
    const photoUrl =
      (photo as { urls?: { regular?: string } })?.urls?.regular ?? "";

    console.log("[unsplash/random] url retornada:", photoUrl);
    return photoUrl;
  } catch (err) {
    console.error("[unsplash/random] exce\u00e7\u00e3o:", err);
    return "";
  }
}

/**
 * Busca uma foto por seção a partir dos termos sugeridos pela IA (em inglês).
 * Termo ausente cai no fallback jurídico. Falha de uma seção não derruba as
 * outras. Sem UNSPLASH_ACCESS_KEY, devolve tudo vazio.
 */
export async function buscarImagensUnsplash(
  queries: Partial<SectionImages>,
): Promise<SectionImages> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return { ...EMPTY_SECTION_IMAGES };

  const out: SectionImages = { ...EMPTY_SECTION_IMAGES };
  const keys: (keyof SectionImages)[] = ["hero", "dor", "sobre", "solucao"];

  await Promise.all(
    keys.map(async (k) => {
      const q = (queries[k] ?? "").trim() || FALLBACK_QUERIES[k];
      try {
        out[k] = await buscarUma(q, accessKey);
      } catch {
        out[k] = "";
      }
    }),
  );

  return out;
}
