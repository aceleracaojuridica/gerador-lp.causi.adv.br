/*
  Biblioteca de focos jurídicos com copy MOCK.

  É o motor da fase 2 (preview híbrido sem IA): ao escolher um foco, montamos
  a copy das seções a partir destes modelos. Na fase 3, o endpoint /api/gerar-copy
  substituirá esta função pela geração real via API Claude (mesmo formato de saída).

  Mantemos os textos sóbrios (Provimento OAB 205/2021): sem promessa de resultado,
  sem números/estatísticas inventadas. Placeholders factuais ficam a cargo do dado real.
*/
import type {
  AreasContent,
  CtaFinalContent,
  DorContent,
  EtapasContent,
  FaqContent,
  HeroContent,
  Layout,
  LpSchema,
  Office,
  SeoMeta,
  SolucaoContent,
  Theme,
} from "./schema";
import { normalizeSeo } from "./seo";

/** Etapas genéricas (fallback sóbrio quando a IA/mock não traz etapas). */
export const GENERIC_ETAPAS: EtapasContent = {
  eyebrow: "Etapas do atendimento",
  headline: { pre: "Simples do ", em: "começo ao fim", post: "" },
  steps: [
    {
      title: "Primeiro contato",
      text: "Você fala com a gente e conta a sua situação, sem compromisso.",
    },
    {
      title: "Análise do caso",
      text: "Avaliamos os documentos e esclarecemos os seus direitos.",
    },
    {
      title: "Plano de ação",
      text: "Definimos a melhor estratégia e os próximos passos.",
    },
    {
      title: "Acompanhamento",
      text: "Conduzimos o caso e atualizamos você até a solução.",
    },
  ],
};

// Contrato da copy de uma LP (partes textuais). Usado pelos focos mock E como
// formato de saída da IA (/api/gerar-copy).
export type FocoCopy = {
  hero: Omit<HeroContent, "ctaPrimary" | "ctaSecondary"> & {
    ctaPrimary?: string;
    ctaSecondary?: string;
  };
  dor: DorContent;
  solucao: SolucaoContent;
  areas: Omit<AreasContent, "cta"> & { cta?: string };
  etapas?: EtapasContent; // opcional: fallback p/ GENERIC_ETAPAS
  faq: FaqContent;
  ctaFinal: CtaFinalContent;
  seo?: SeoMeta; // gerado pela IA; ausente nos focos mock (não prejudica LP)
};

export type Foco = {
  id: string;
  label: string; // rótulo exibido no formulário
  product: string; // preenche office.product
  area: string; // preenche office.area
  copy: FocoCopy;
};

export const CTA_PRIMARY = "Analisar meu caso";
export const CTA_SECONDARY = "Como funciona";
export const AREAS_CTA_FALLBACK = "Não sei em qual caso me encaixo";

export const FOCOS: Foco[] = [
  {
    id: "trabalhista",
    label: "Direito Trabalhista",
    product: "Direito Trabalhista",
    area: "Direito do Trabalho",
    copy: {
      hero: {
        eyebrow: "Advocacia Trabalhista",
        headline: {
          pre: "Foi demitido ou teve seus direitos ignorados? A lei trabalhista está ",
          em: "do seu lado",
          post: ".",
        },
        sub: "A gente analisa o seu caso e mostra, com clareza, o que você tem direito a receber.",
        features: [
          {
            icon: "shield-check",
            title: "Defesa de quem trabalha",
            text: "Atuação focada nos direitos do trabalhador.",
          },
          {
            icon: "clock",
            title: "Atuação especializada",
            text: "Experiência diária na área trabalhista.",
          },
          {
            icon: "handshake",
            title: "Atendimento próximo",
            text: "Relação direta com o advogado responsável.",
          },
        ],
      },
      dor: {
        eyebrow: "O que você vive hoje",
        headline: {
          pre: "Você reconhece alguma dessas ",
          em: "situações",
          post: "?",
        },
        intro:
          "Quando o vínculo termina, é comum a sensação de que algo ficou para trás. O primeiro passo é entender o seu caso, sem compromisso.",
        cards: [
          {
            icon: "file-x",
            title: "Verbas não pagas na rescisão",
            text: "Saldo de salário, férias, 13º ou multa do FGTS que não vieram, ou vieram pela metade.",
          },
          {
            icon: "timer",
            title: "Horas extras sem registro",
            text: "Você trabalhava além da jornada, mas nada disso aparecia no contracheque.",
          },
          {
            icon: "alert",
            title: "Condições de risco sem adicional",
            text: "Insalubridade ou periculosidade no dia a dia e nenhum adicional sobre o salário.",
          },
          {
            icon: "user-check",
            title: "Demissão que você considera injusta",
            text: "Justa causa aplicada de forma indevida ou sem o direito à ampla defesa.",
          },
        ],
      },
      solucao: {
        eyebrow: "Como ajudamos",
        headline: {
          pre: "Do primeiro contato à ",
          em: "solução do seu caso",
          post: "",
        },
        sub: "Um caminho claro, conduzido por quem é especialista em Direito do Trabalho.",
        cards: [
          {
            icon: "search",
            title: "Análise do seu caso",
            text: "Avaliamos contrato, contracheques e o que aconteceu para entender o que é devido.",
          },
          {
            icon: "calculator",
            title: "Levantamento das verbas",
            text: "Identificamos cada direito em aberto, das verbas rescisórias aos adicionais não pagos.",
          },
          {
            icon: "gavel",
            title: "Ação ou acordo",
            text: "Ingressamos com a medida certa e buscamos a melhor via, judicial ou negociada.",
          },
          {
            icon: "bell",
            title: "Você sempre informado",
            text: "Acompanhamos o processo e atualizamos você em cada movimentação importante.",
          },
        ],
      },
      areas: {
        eyebrow: "Áreas de atuação",
        headline: {
          pre: "Onde o Direito do Trabalho pode ",
          em: "proteger você",
          post: "",
        },
        sub: "A relação de trabalho gera muitos direitos, e nem sempre eles são respeitados.",
        cards: [
          {
            icon: "banknote",
            title: "Verbas rescisórias",
            text: "Saldo de salário, aviso prévio, férias, 13º e multa de 40% do FGTS pagos corretamente.",
          },
          {
            icon: "clock",
            title: "Horas extras e adicionais",
            text: "Jornada além do contratado, adicional noturno, de insalubridade e de periculosidade.",
          },
          {
            icon: "user-check",
            title: "Reconhecimento de vínculo",
            text: "Trabalho sem registro ou pejotizado que precisa ter o vínculo de emprego reconhecido.",
          },
          {
            icon: "shield-x",
            title: "Rescisão e justa causa",
            text: "Rescisão indireta e revisão de justa causa aplicada sem fundamento pelo empregador.",
          },
        ],
      },
      faq: {
        eyebrow: "Dúvidas frequentes",
        headline: { pre: "Perguntas ", em: "comuns", post: "" },
        items: [
          {
            q: "Quanto tempo tenho para entrar com a ação?",
            a: "Em regra, até 2 anos após o fim do contrato, podendo cobrar os últimos 5 anos. Vale avaliar o quanto antes para não perder prazos.",
          },
          {
            q: "Tem custo para analisar meu caso?",
            a: "A conversa inicial para entender a sua situação é sem compromisso. Os honorários são combinados com clareza antes de qualquer passo.",
          },
          {
            q: "Tenho direito mesmo sem carteira assinada?",
            a: "Sim. O vínculo de emprego pode ser reconhecido na Justiça mesmo sem registro, com base nas provas do dia a dia de trabalho.",
          },
          {
            q: "Quanto tempo demora o processo?",
            a: "Varia conforme a complexidade e a fase. Acompanhamos você e informamos cada movimentação importante.",
          },
        ],
      },
      ctaFinal: {
        headline: {
          pre: "A conversa inicial é ",
          em: "sem compromisso",
          post: "",
        },
        sub: "Conte o que aconteceu e descubra, com clareza, o que você pode ter direito a receber.",
        cta: "Falar com um especialista",
      },
    },
  },
  {
    id: "previdenciario",
    label: "Direito Previdenciário (INSS)",
    product: "Direito Previdenciário",
    area: "Direito Previdenciário",
    copy: {
      hero: {
        eyebrow: "Advocacia Previdenciária",
        headline: {
          pre: "Seu benefício foi negado pelo INSS? Você pode ter ",
          em: "direito a recorrer",
          post: ".",
        },
        sub: "Analisamos o seu caso junto ao INSS e mostramos o melhor caminho para garantir o seu benefício.",
        features: [
          {
            icon: "shield-check",
            title: "Atuação previdenciária",
            text: "Foco em benefícios do INSS e revisões.",
          },
          {
            icon: "landmark",
            title: "Linguagem clara",
            text: "Explicamos cada etapa sem juridiquês.",
          },
          {
            icon: "handshake",
            title: "Acompanhamento próximo",
            text: "Você é informado em cada movimentação.",
          },
        ],
      },
      dor: {
        eyebrow: "O que você enfrenta hoje",
        headline: {
          pre: "Está passando por alguma dessas ",
          em: "situações",
          post: "?",
        },
        intro:
          "Negativas e exigências do INSS podem parecer o fim do caminho, mas muitas vezes são apenas o começo. O primeiro passo é entender o seu direito.",
        cards: [
          {
            icon: "file-x",
            title: "Benefício negado",
            text: "O INSS indeferiu seu pedido e você não entendeu o motivo.",
          },
          {
            icon: "timer",
            title: "Perícia desfavorável",
            text: "A perícia concluiu pela capacidade, mas a sua realidade é outra.",
          },
          {
            icon: "alert",
            title: "Valor abaixo do devido",
            text: "Você desconfia que o benefício foi calculado por um valor menor.",
          },
        ],
      },
      solucao: {
        eyebrow: "Como ajudamos",
        headline: { pre: "Do pedido ao ", em: "benefício concedido", post: "" },
        sub: "Um caminho seguro, conduzido por quem entende de Direito Previdenciário.",
        cards: [
          {
            icon: "search",
            title: "Análise do seu caso",
            text: "Avaliamos documentos, CNIS e laudos para entender o seu direito.",
          },
          {
            icon: "file-text",
            title: "Reunião de provas",
            text: "Organizamos a documentação que sustenta o seu pedido.",
          },
          {
            icon: "gavel",
            title: "Pedido ou ação",
            text: "Atuamos na via administrativa ou judicial, conforme o seu caso.",
          },
          {
            icon: "bell",
            title: "Você sempre informado",
            text: "Acompanhamos o andamento e atualizamos você a cada passo.",
          },
        ],
      },
      areas: {
        eyebrow: "Áreas de atuação",
        headline: {
          pre: "Como o Direito Previdenciário pode ",
          em: "proteger você",
          post: "",
        },
        sub: "Há mais direitos do que se imagina junto ao INSS. Veja algumas frentes em que atuamos.",
        cards: [
          {
            icon: "clock",
            title: "Aposentadorias",
            text: "Por idade, por tempo de contribuição e regras de transição.",
          },
          {
            icon: "heart-pulse",
            title: "Auxílio por incapacidade",
            text: "Auxílio-doença e aposentadoria por invalidez em casos de incapacidade.",
          },
          {
            icon: "hand-coins",
            title: "Benefício assistencial (BPC/LOAS)",
            text: "Para idosos e pessoas com deficiência em situação de vulnerabilidade.",
          },
          {
            icon: "calculator",
            title: "Revisões de benefício",
            text: "Revisão do valor de benefícios concedidos com cálculo incorreto.",
          },
        ],
      },
      faq: {
        eyebrow: "Dúvidas frequentes",
        headline: { pre: "Perguntas ", em: "comuns", post: "" },
        items: [
          {
            q: "Meu benefício foi negado. Ainda tenho chance?",
            a: "Sim. Uma negativa do INSS não é o fim: é possível recorrer na via administrativa ou judicial, conforme o seu caso.",
          },
          {
            q: "Preciso ir até uma agência do INSS?",
            a: "Boa parte do acompanhamento é feita pelos canais digitais. Orientamos você em cada etapa, com linguagem clara.",
          },
          {
            q: "Quais documentos preciso reunir?",
            a: "Em geral, documentos pessoais, CNIS e laudos ou comprovantes ligados ao pedido. Avaliamos o que falta no seu caso.",
          },
          {
            q: "Tem custo para analisar meu caso?",
            a: "A análise inicial é sem compromisso. Os honorários são definidos com transparência antes de seguir.",
          },
        ],
      },
      ctaFinal: {
        headline: {
          pre: "A análise inicial é ",
          em: "sem compromisso",
          post: "",
        },
        sub: "Conte a sua situação e descubra, com clareza, qual benefício você pode ter direito a receber.",
        cta: "Analisar meu benefício",
      },
    },
  },
  {
    id: "familia",
    label: "Direito de Família",
    product: "Direito de Família",
    area: "Direito de Família e Sucessões",
    copy: {
      hero: {
        eyebrow: "Advocacia de Família",
        headline: {
          pre: "Decisões de família exigem cuidado. Você não precisa passar por isso ",
          em: "sozinho",
          post: ".",
        },
        sub: "Conduzimos cada caso com discrição e respeito, buscando a solução mais equilibrada para a sua família.",
        features: [
          {
            icon: "shield-check",
            title: "Sigilo e respeito",
            text: "Cada caso tratado com total discrição.",
          },
          {
            icon: "handshake",
            title: "Postura conciliadora",
            text: "Buscamos o acordo sempre que possível.",
          },
          {
            icon: "users",
            title: "Atendimento humano",
            text: "Acompanhamento próximo do início ao fim.",
          },
        ],
      },
      dor: {
        eyebrow: "O que você vive hoje",
        headline: {
          pre: "Está enfrentando alguma dessas ",
          em: "questões",
          post: "?",
        },
        intro:
          "Momentos de família são delicados e cheios de dúvidas. O primeiro passo é entender seus direitos com clareza e tranquilidade.",
        cards: [
          {
            icon: "scroll",
            title: "Divórcio e partilha",
            text: "Dúvidas sobre como dividir bens e formalizar a separação.",
          },
          {
            icon: "baby",
            title: "Guarda e pensão",
            text: "Definição de guarda, convivência e valor de pensão dos filhos.",
          },
          {
            icon: "alert",
            title: "Conflitos não resolvidos",
            text: "Situações que se arrastam e precisam de uma solução justa.",
          },
        ],
      },
      solucao: {
        eyebrow: "Como ajudamos",
        headline: {
          pre: "Do primeiro contato à ",
          em: "solução equilibrada",
          post: "",
        },
        sub: "Um caminho conduzido com técnica e sensibilidade em Direito de Família.",
        cards: [
          {
            icon: "search",
            title: "Entendimento do caso",
            text: "Ouvimos a sua situação e esclarecemos os seus direitos.",
          },
          {
            icon: "file-text",
            title: "Estratégia definida",
            text: "Traçamos o melhor caminho para o seu objetivo.",
          },
          {
            icon: "handshake",
            title: "Acordo ou ação",
            text: "Priorizamos o acordo e, quando preciso, atuamos judicialmente.",
          },
          {
            icon: "bell",
            title: "Você sempre informado",
            text: "Acompanhamos cada etapa com transparência.",
          },
        ],
      },
      areas: {
        eyebrow: "Áreas de atuação",
        headline: {
          pre: "Como o Direito de Família pode ",
          em: "ajudar você",
          post: "",
        },
        sub: "Veja algumas das frentes em que atuamos para proteger você e a sua família.",
        cards: [
          {
            icon: "scroll",
            title: "Divórcio e dissolução",
            text: "Divórcio consensual ou litigioso e dissolução de união estável.",
          },
          {
            icon: "baby",
            title: "Guarda e pensão",
            text: "Guarda, convivência, alimentos e revisão de pensão.",
          },
          {
            icon: "home",
            title: "Partilha de bens",
            text: "Divisão de patrimônio com segurança e clareza.",
          },
          {
            icon: "file-text",
            title: "Inventário e sucessões",
            text: "Inventário, herança e planejamento sucessório.",
          },
        ],
      },
      faq: {
        eyebrow: "Dúvidas frequentes",
        headline: { pre: "Perguntas ", em: "comuns", post: "" },
        items: [
          {
            q: "O divórcio precisa ser litigioso?",
            a: "Nem sempre. Quando há acordo, o divórcio pode ser consensual e mais rápido. Buscamos sempre a via menos desgastante.",
          },
          {
            q: "Como é definida a guarda dos filhos?",
            a: "A guarda considera o melhor interesse da criança. Explicamos as opções e conduzimos com sensibilidade.",
          },
          {
            q: "Posso revisar o valor da pensão?",
            a: "Sim. A pensão pode ser revista quando muda a necessidade de quem recebe ou a possibilidade de quem paga.",
          },
          {
            q: "O atendimento é sigiloso?",
            a: "Totalmente. Questões de família são delicadas e tratadas com total discrição e respeito.",
          },
        ],
      },
      ctaFinal: {
        headline: {
          pre: "A conversa inicial é ",
          em: "sigilosa e sem compromisso",
          post: "",
        },
        sub: "Conte a sua situação com tranquilidade e entenda, com clareza, quais são os seus direitos.",
        cta: "Conversar com um advogado",
      },
    },
  },
];

/**
 * Foco genérico (base neutra), usado quando o tema livre não casa com nenhum
 * foco conhecido. A copy real e sob medida virá da IA (fase 3) a partir do tema.
 */
export function focoGenerico(): FocoCopy {
  return {
    hero: {
      eyebrow: "Advocacia",
      headline: {
        pre: "Precisa de orientação ",
        em: "jurídica",
        post: "? A gente te ajuda.",
      },
      sub: "Analisamos o seu caso e mostramos, com clareza, o melhor caminho a seguir.",
      features: [
        {
          icon: "shield-check",
          title: "Atuação dedicada",
          text: "Foco no seu caso, do início ao fim.",
        },
        {
          icon: "scale",
          title: "Orientação clara",
          text: "Explicamos cada etapa sem juridiquês.",
        },
        {
          icon: "handshake",
          title: "Atendimento próximo",
          text: "Relação direta com o advogado responsável.",
        },
      ],
    },
    dor: {
      eyebrow: "O que você vive hoje",
      headline: {
        pre: "Você está passando por alguma ",
        em: "dificuldade",
        post: "?",
      },
      intro:
        "Toda situação jurídica gera dúvidas. O primeiro passo é entender o seu caso, sem compromisso.",
      cards: [
        {
          icon: "alert",
          title: "Dúvidas sobre seus direitos",
          text: "Você não tem certeza do que pode ou deve fazer.",
        },
        {
          icon: "file-text",
          title: "Documentos e prazos",
          text: "Receio de perder um prazo ou de não ter a documentação certa.",
        },
        {
          icon: "search",
          title: "Falta de orientação",
          text: "Você precisa de uma análise clara antes de decidir.",
        },
      ],
    },
    solucao: {
      eyebrow: "Como ajudamos",
      headline: {
        pre: "Do primeiro contato à ",
        em: "solução do seu caso",
        post: "",
      },
      sub: "Um caminho claro, conduzido por quem entende do assunto.",
      cards: [
        {
          icon: "search",
          title: "Análise do seu caso",
          text: "Entendemos a sua situação e os seus objetivos.",
        },
        {
          icon: "file-text",
          title: "Estratégia definida",
          text: "Traçamos o melhor caminho para o seu caso.",
        },
        {
          icon: "gavel",
          title: "Atuação",
          text: "Conduzimos a medida adequada, com técnica e cuidado.",
        },
        {
          icon: "bell",
          title: "Você sempre informado",
          text: "Acompanhamos cada etapa com transparência.",
        },
      ],
    },
    areas: {
      eyebrow: "Áreas de atuação",
      headline: { pre: "Como podemos ", em: "ajudar você", post: "" },
      sub: "Veja algumas das frentes em que atuamos.",
      cards: [
        {
          icon: "scale",
          title: "Consultoria",
          text: "Orientação jurídica para você decidir com segurança.",
        },
        {
          icon: "file-text",
          title: "Análise documental",
          text: "Avaliação de contratos e documentos do seu caso.",
        },
        {
          icon: "gavel",
          title: "Atuação judicial",
          text: "Representação quando o seu caso exige ação na justiça.",
        },
        {
          icon: "handshake",
          title: "Acordos",
          text: "Negociação e formalização de acordos.",
        },
      ],
    },
    faq: {
      eyebrow: "Dúvidas frequentes",
      headline: { pre: "Perguntas ", em: "comuns", post: "" },
      items: [
        {
          q: "A primeira conversa tem custo?",
          a: "Não. A conversa inicial para entender o seu caso é sem compromisso. Os honorários são combinados com clareza antes de seguir.",
        },
        {
          q: "Vou falar direto com o advogado?",
          a: "Sim. Você tem acompanhamento próximo do responsável pelo seu caso, do início ao fim.",
        },
        {
          q: "Quanto tempo leva para resolver?",
          a: "Depende da complexidade e da via adotada. Mantemos você informado a cada etapa importante.",
        },
        {
          q: "Como começo?",
          a: "Basta entrar em contato e contar a sua situação. A partir daí, avaliamos e indicamos o melhor caminho.",
        },
      ],
    },
    ctaFinal: {
      headline: {
        pre: "A conversa inicial é ",
        em: "sem compromisso",
        post: "",
      },
      sub: "Conte a sua situação e descubra, com clareza, o melhor caminho a seguir.",
      cta: "Falar com um advogado",
    },
  };
}

// Palavras-chave para casar o TEMA livre digitado com um foco de copy rica.
const FOCO_KEYWORDS: Record<string, string[]> = {
  trabalhista: [
    "trabalhista",
    "trabalho",
    "clt",
    "rescis",
    "demiss",
    "verba",
    "hora extra",
  ],
  previdenciario: [
    "previdenc",
    "inss",
    "aposentad",
    "bpc",
    "loas",
    "benefício",
    "beneficio",
    "auxílio",
    "auxilio",
  ],
  familia: [
    "família",
    "familia",
    "divórcio",
    "divorcio",
    "guarda",
    "pensão",
    "pensao",
    "inventário",
    "inventario",
    "herança",
    "heranca",
    "alimentos",
  ],
};

/**
 * Casa o tema livre (ex: "lp sobre direito trabalhista") com um foco conhecido
 * pelas palavras-chave. Sem correspondência, devolve undefined (base genérica).
 */
export function matchFoco(tema: string): Foco | undefined {
  const t = (tema || "").toLowerCase();
  if (!t.trim()) return undefined;
  for (const f of FOCOS) {
    if (FOCO_KEYWORDS[f.id]?.some((kw) => t.includes(kw))) return f;
  }
  return undefined;
}

/**
 * Monta um LpSchema completo a partir dos fatos (office + theme) e do TEMA livre.
 * Hoje: casa o tema com um foco conhecido (copy rica) ou usa base genérica.
 * Fase 3: o endpoint de IA substitui isto, escrevendo a copy a partir do tema.
 */
export function buildSchema(
  office: Office,
  theme: Theme,
  tema: string,
  layout: Layout,
  videoId?: string,
  aiCopy?: FocoCopy | null,
): LpSchema {
  // Prioridade: copy da IA → foco casado por palavra-chave → base genérica.
  const foco = matchFoco(tema);
  const copy = aiCopy ?? (foco ? foco.copy : focoGenerico());

  const hero = {
    ...copy.hero,
    ctaPrimary: copy.hero.ctaPrimary ?? CTA_PRIMARY,
    ctaSecondary: copy.hero.ctaSecondary ?? CTA_SECONDARY,
  };

  const partial: LpSchema = {
    theme,
    office,
    layout,
    videoId,
    hero,
    dor: copy.dor,
    solucao: copy.solucao,
    areas: { ...copy.areas, cta: copy.areas.cta ?? AREAS_CTA_FALLBACK },
    etapas: copy.etapas ?? GENERIC_ETAPAS,
    faq: copy.faq,
    ctaFinal: copy.ctaFinal,
  };

  return {
    ...partial,
    seo: normalizeSeo(copy.seo, partial, tema),
  };
}
