/*
  Banco de imagens curado (Unsplash) por área jurídica — URLs reais e
  verificadas, escolhidas manualmente. Usado como fonte das imagens de cenário
  quando NÃO há UNSPLASH_ACCESS_KEY (ou para preencher um slot que a busca ao
  vivo não trouxe). Assim a LP sai com imagens mesmo sem chave de API.

  Só CENÁRIO (hero/dor/sobre). Fotos de pessoas são upload do usuário.
*/
import type { SectionImages } from "./section-images";

const SIZE = "?auto=format&fit=crop&w=1600&q=80";
const u = (id: string) => `https://images.unsplash.com/photo-${id}${SIZE}`;

// Ambiente de escritório (seção Sobre) — comum a todas as áreas.
const SOBRE = u("1571055931484-22dce9d6c510");
// Atendimento/orientação (seção Solução "como ajudamos") — comum.
const SOLUCAO = u("1551836022-d5d88e9218df");

type Cat = { hero: string; dor: string };

const CATS: Record<string, Cat> = {
  trabalhista: {
    hero: u("1551836022-d5d88e9218df"), // reunião advogado/cliente
    dor: u("1573824512226-4892466a08c3"), // trabalhador preocupado
  },
  previdenciario: {
    hero: u("1551559347-b2df2a690bd5"), // casal idoso em casa
    dor: u("1541199249251-f713e6145474"), // pessoa preocupada com papéis
  },
  familia: {
    hero: u("1606788075819-9574a6edfab3"), // família reunida
    dor: u("1549227082-0ea18ce30397"), // conflito/tensão
  },
  consumidor: {
    hero: u("1551836022-d5d88e9218df"), // atendimento
    dor: u("1620809975674-10b8ff5f8e58"), // pessoa estressada com contas
  },
  generico: {
    hero: u("1497366754035-f200968a6e72"), // escritório de advocacia
    dor: u("1541199249251-f713e6145474"),
  },
};

const KEYWORDS: [string, string[]][] = [
  [
    "trabalhista",
    ["trabalh", "clt", "rescis", "demiss", "verba", "hora extra", "fgts"],
  ],
  [
    "previdenciario",
    [
      "previden",
      "inss",
      "aposentad",
      "bpc",
      "loas",
      "auxílio",
      "auxilio",
      "benefíci",
      "benefici",
      "incapac",
    ],
  ],
  [
    "familia",
    [
      "famíli",
      "famili",
      "divórc",
      "divorc",
      "guarda",
      "pensão",
      "pensao",
      "inventári",
      "inventari",
      "herança",
      "heranca",
      "aliment",
      "união estável",
      "uniao estavel",
    ],
  ],
  [
    "consumidor",
    [
      "consumidor",
      "negativ",
      "cobrança",
      "cobranca",
      "dívida",
      "divida",
      "superendivid",
      "banco",
      "abusiv",
      "contrato",
    ],
  ],
];

// Pools por seção (IDs verificados) — usados quando NÃO há chave do Unsplash,
// para VARIAR a imagem a cada clique mesmo sem busca ao vivo.
const POOL: Record<keyof SectionImages, string[]> = {
  hero: [
    u("1551836022-d5d88e9218df"),
    u("1551559347-b2df2a690bd5"),
    u("1606788075819-9574a6edfab3"),
    u("1497366754035-f200968a6e72"),
  ],
  dor: [
    u("1573824512226-4892466a08c3"),
    u("1541199249251-f713e6145474"),
    u("1549227082-0ea18ce30397"),
    u("1620809975674-10b8ff5f8e58"),
  ],
  sobre: [
    u("1571055931484-22dce9d6c510"),
    u("1497366754035-f200968a6e72"),
    u("1551836022-d5d88e9218df"),
  ],
  solucao: [
    u("1551836022-d5d88e9218df"),
    u("1551559347-b2df2a690bd5"),
    u("1606788075819-9574a6edfab3"),
  ],
};

/** Sorteia uma imagem do pool da seção, evitando repetir a atual (exclude). */
export function imagemAleatoria(
  sectionKey: keyof SectionImages,
  exclude?: string,
): string {
  const pool = POOL[sectionKey] ?? POOL.hero;
  const opts = pool.filter((url) => url !== exclude);
  const list = opts.length ? opts : pool;
  return list[Math.floor(Math.random() * list.length)];
}

/** Categoria jurídica do tema (por palavra-chave); "generico" se não casar. */
export function categoriaDoTema(tema: string): string {
  const t = (tema || "").toLowerCase();
  for (const [c, list] of KEYWORDS) {
    if (list.some((k) => t.includes(k))) return c;
  }
  return "generico";
}

/** Resolve as 3 imagens de cenário a partir do tema (por palavra-chave). */
export function imagensDoTema(tema: string): SectionImages {
  const sel = CATS[categoriaDoTema(tema)] ?? CATS.generico;
  return { hero: sel.hero, dor: sel.dor, sobre: SOBRE, solucao: SOLUCAO };
}
