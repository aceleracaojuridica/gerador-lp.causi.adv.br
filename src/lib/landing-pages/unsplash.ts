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

import {
  type ExternalApiLogMeta,
  logExternalApiCall,
} from "./lp-external-api-log";
import { EMPTY_SECTION_IMAGES, type SectionImages } from "./section-images";

// Consultas-base (inglês) quando a IA não sugere termos.
const FALLBACK_QUERIES: SectionImages = {
  hero: "worried person reading legal documents at home",
  dor: "stressed person with papers financial problem",
  sobre: "modern law office interior professional meeting room",
  solucao: "lawyer consulting client at desk professional",
};

async function buscarUma(
  query: string,
  accessKey: string,
  log?: ExternalApiLogMeta,
): Promise<string> {
  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&per_page=10&content_filter=high";

  const started = Date.now();
  const res = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
    cache: "no-store",
  });

  const finish = (ok: boolean, photoUrl: string, error?: string) => {
    if (!log) return;
    void logExternalApiCall({
      ...log,
      provider: "unsplash",
      operation: "unsplash.search",
      requestPayload: { query, orientation: "landscape", per_page: 10 },
      responsePayload: { url: photoUrl || null },
      statusCode: res.status,
      durationMs: Date.now() - started,
      ok,
      error,
    });
  };

  if (!res.ok) {
    finish(false, "", `HTTP ${res.status}`);
    return "";
  }

  const data = (await res.json()) as {
    results?: { urls?: { regular?: string } }[];
  };
  const results = data.results ?? [];
  if (!results.length) {
    finish(false, "", "no_results");
    return "";
  }
  // Pega aleatoriamente entre os primeiros resultados para maior variedade
  const pick = results[Math.floor(Math.random() * results.length)];
  const photoUrl = pick?.urls?.regular ?? "";
  finish(Boolean(photoUrl), photoUrl);
  return photoUrl;
}

/**
 * Busca uma imagem ALEATÓRIA entre os resultados da consulta (cada chamada
 * tende a trazer uma diferente). Vazio se não houver chave ou resultado.
 * Usada pelo botão "IA escolhe" do editor.
 */
export async function buscarUmaImagem(
  query: string,
  log?: ExternalApiLogMeta,
): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return "";
  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&per_page=24&content_filter=high";
  const started = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      if (log) {
        void logExternalApiCall({
          ...log,
          provider: "unsplash",
          operation: "unsplash.search",
          requestPayload: { query, per_page: 24 },
          statusCode: res.status,
          durationMs: Date.now() - started,
          ok: false,
          error: `HTTP ${res.status}`,
        });
      }
      return "";
    }
    const data = (await res.json()) as {
      results?: { urls?: { regular?: string } }[];
    };
    const results = data.results ?? [];
    if (!results.length) {
      if (log) {
        void logExternalApiCall({
          ...log,
          provider: "unsplash",
          operation: "unsplash.search",
          requestPayload: { query, per_page: 24 },
          statusCode: res.status,
          durationMs: Date.now() - started,
          ok: false,
          error: "no_results",
        });
      }
      return "";
    }
    const pick = results[Math.floor(Math.random() * results.length)];
    const photoUrl = pick?.urls?.regular ?? "";
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "unsplash",
        operation: "unsplash.search",
        requestPayload: { query, per_page: 24 },
        responsePayload: { url: photoUrl || null },
        statusCode: res.status,
        durationMs: Date.now() - started,
        ok: Boolean(photoUrl),
      });
    }
    return photoUrl;
  } catch (err) {
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "unsplash",
        operation: "unsplash.search",
        requestPayload: { query, per_page: 24 },
        durationMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return "";
  }
}

/**
 * Busca uma imagem aleatória usando o endpoint /photos/random da Unsplash.
 * Cada chamada retorna uma foto diferente — ideal para o botão "IA escolhe"
 * no editor, onde queremos variação garantida sem repetição.
 */
export async function buscarImagemAleatoria(
  query: string,
  log?: ExternalApiLogMeta,
): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return "";

  const url =
    "https://api.unsplash.com/photos/random" +
    `?query=${encodeURIComponent(query)}` +
    "&orientation=landscape&content_filter=high&count=1";

  const started = Date.now();
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
      const errText = await res.text();
      console.log("[unsplash/random] erro:", errText);
      if (log) {
        void logExternalApiCall({
          ...log,
          provider: "unsplash",
          operation: "unsplash.random",
          requestPayload: { query },
          statusCode: res.status,
          durationMs: Date.now() - started,
          ok: false,
          error: errText.slice(0, 500),
        });
      }
      return "";
    }

    const data = (await res.json()) as { urls?: { regular?: string } }[];
    const photo = Array.isArray(data) ? data[0] : data;
    const photoUrl =
      (photo as { urls?: { regular?: string } })?.urls?.regular ?? "";

    console.log("[unsplash/random] url retornada:", photoUrl);
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "unsplash",
        operation: "unsplash.random",
        requestPayload: { query },
        responsePayload: { url: photoUrl || null },
        statusCode: res.status,
        durationMs: Date.now() - started,
        ok: Boolean(photoUrl),
      });
    }
    return photoUrl;
  } catch (err) {
    console.error("[unsplash/random] exce\u00e7\u00e3o:", err);
    if (log) {
      void logExternalApiCall({
        ...log,
        provider: "unsplash",
        operation: "unsplash.random",
        requestPayload: { query },
        durationMs: Date.now() - started,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
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
  log?: ExternalApiLogMeta,
): Promise<SectionImages> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return { ...EMPTY_SECTION_IMAGES };

  const out: SectionImages = { ...EMPTY_SECTION_IMAGES };
  const keys: (keyof SectionImages)[] = ["hero", "dor", "sobre", "solucao"];

  await Promise.all(
    keys.map(async (k) => {
      const q = (queries[k] ?? "").trim() || FALLBACK_QUERIES[k];
      try {
        out[k] = await buscarUma(q, accessKey, log);
      } catch {
        out[k] = "";
      }
    }),
  );

  return out;
}
