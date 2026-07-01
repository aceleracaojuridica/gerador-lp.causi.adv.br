/*
  Lógica compartilhada de geração de copy via OpenAI, usada pelos endpoints
  /api/gerar-copy (preview sem salvar) e /api/gerar-lp (geração completa).
*/
import OpenAI from "openai";
import type { FocoCopy } from "./focos";
import { ICON_KEYS } from "./icons";

export type CopyPayload = {
  name?: string;
  tema?: string;
  city?: string;
  about?: string;
  diferenciais?: string[];
};

export const COPY_SYSTEM = [
  "Você é redator(a) jurídico(a) brasileiro(a) especialista em landing pages de captação para advogados, anunciadas no Google e no Meta.",
  "Escreve copy PERSUASIVA mas SÓBRIA, fiel ao tema. O leitor chega de um anúncio pago e decide em poucos segundos: a manchete precisa fisgar e dar clareza imediata.",
  "",
  "REGRAS INVIOLÁVEIS:",
  "1. Português brasileiro impecável.",
  "2. FALE DO TEMA ESPECÍFICO: nomeie a dor concreta e PARA QUEM é a página. Nada de copy genérica.",
  "2b. MANCHETES SÃO CONVITES, NÃO RÓTULOS: nunca use o tema ou a área como título seco. Toda manchete fala com o leitor e promete o benefício que ele busca (clareza, segurança, proteção, tranquilidade, recomeço) — sem garantir resultado de causa.",
  "3. NUNCA invente fatos: sem números, anos, casos, taxas de êxito, OAB ou prêmios que não estejam nos fatos fornecidos.",
  "4. Sobriedade OAB (Provimento 205/2021): sem promessa de resultado, sem 'ganhe sua causa', sem sensacionalismo, sem superlativos vazios.",
  "5. Sem travessões. Tom acolhedor e profissional.",
  "6. Verbos de atuação ('analisamos', 'orientamos', 'acompanhamos'), não de garantia.",
  "7. Responda SOMENTE com JSON válido no formato pedido. Nada fora do JSON.",
  '8. Para o bloco "seo": title 50-60 chars (keyword do tema no início + " | " + nome-escritório); description 140-155 chars (benefício concreto + CTA suave). Sem garantia de resultado.',
].join("\n");

export function buildCopyUserPrompt(p: CopyPayload): string {
  const fatos = [
    p.name ? `Escritório: ${p.name}` : "",
    p.city ? `Cidade: ${p.city}` : "",
    p.about ? `Sobre (use como base, não copie literal): ${p.about}` : "",
    p.diferenciais?.length ? `Diferenciais: ${p.diferenciais.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `TEMA DA LANDING PAGE (foco central, fale disto o tempo todo):
"${p.tema}"

FATOS DO ESCRITÓRIO:
${fatos || "(nenhum fato adicional informado)"}

Escreva a copy de uma landing page jurídica sobre esse TEMA, que será ANUNCIADA no Google/Meta. Toda manchete tem um trecho em destaque ("em").

MANCHETE DO HERO (hero.headline) — é o que mais importa:
• É um CONVITE orientado a BENEFÍCIO, falando com o leitor — NÃO o rótulo do tema/área.
• Transforme o tema em promessa emocional (segurança, clareza, proteção, tranquilidade, recomeço), sem prometer resultado de causa.
• 6 a 12 palavras no total; o trecho "em" carrega a palavra-chave emocional.
  RUIM (rótulo seco): pre "Renegociação de dívidas e superendividamento" / em "" / post ""  ← só descreve o tema
  BOM (promessa):     pre "Saia das dívidas e " / em "recupere sua tranquilidade" / post ""
  BOM (outro tema):   pre "Sofreu um acidente? " / em "Entenda seus direitos à indenização" / post ""
  Adapte ao SEU tema; não copie os exemplos.
• O "eyebrow" pode nomear a área (ex: "Direito de Família"); a manchete vende o benefício, não repete a área.
• As demais manchetes (dor, solução, áreas, etapas, faq, ctaFinal) também falam com o leitor e destacam benefício/empatia — nunca rótulos secos.

CTAs: ctaPrimary = ação de contato direta ("Falar com um advogado", "Agendar atendimento"); ctaSecondary = passo mais leve ("Tirar minha dúvida", "Ver como funciona"). NÃO invente oferta: não escreva "grátis"/"gratuita" se isso não foi informado nos fatos.

Use APENAS estes ícones (campo "icon"): ${ICON_KEYS.join(", ")}.

Responda com este JSON EXATO (sem comentários):
{
  "hero": { "eyebrow": "string curta", "headline": { "pre": "início", "em": "destaque", "post": "fim (pode ser vazio)" }, "sub": "1-2 frases sobre a dor do público", "ctaPrimary": "botão", "ctaSecondary": "botão", "features": [ { "icon": "chave", "title": "curto", "text": "1 frase" }, {…}, {…} ] },
  "dor": { "eyebrow": "string", "headline": { "pre": "...", "em": "...", "post": "? " }, "intro": "2-3 frases de empatia", "cards": [ { "icon": "chave", "title": "dor concreta", "text": "1-2 frases" } x3 ] },
  "solucao": { "eyebrow": "string", "headline": { "pre": "...", "em": "...", "post": "" }, "sub": "1 frase", "cards": [ { "icon": "chave", "title": "como atuamos", "text": "1 frase" } x4 ] },
  "areas": { "eyebrow": "string", "headline": { "pre": "...", "em": "...", "post": "" }, "sub": "1 frase", "cards": [ { "icon": "chave", "title": "frente de atuação", "text": "1 frase" } x4 ], "cta": "botão" },
  "etapas": { "eyebrow": "string (ex: Etapas do atendimento)", "headline": { "pre": "...", "em": "...", "post": "" }, "steps": [ { "title": "passo curto", "text": "1 frase do que acontece" } x4 ] },
  "faq": { "eyebrow": "string", "headline": { "pre": "...", "em": "...", "post": "" }, "items": [ { "q": "pergunta real do público", "a": "resposta sóbria" } x4 ] },
  "ctaFinal": { "headline": { "pre": "...", "em": "...", "post": "" }, "sub": "1-2 frases", "cta": "botão" },
  "seo": { "title": "50-60 chars: keyword | Nome Escritório", "description": "140-155 chars: benefício concreto + CTA suave" },
  "imageQueries": { "hero": "termo em INGLÊS p/ FOTO de cenário", "dor": "termo em INGLÊS", "sobre": "termo em INGLÊS de ambiente de escritório", "solucao": "termo em INGLÊS de advogado atendendo/orientando cliente" }
}

REGRAS "imageQueries" (buscam FOTOS no Unsplash): 2-5 palavras em INGLÊS, CENA/AMBIENTE ligado ao tema e ao público (ex: previdenciário → hero "elderly brazilian couple at home"). "sobre" sempre ambiente de escritório. NUNCA texto/logo/bandeira/martelo/balança nem retrato de pessoa específica.

REGRAS "seo": title com a keyword do TEMA no início (mesmo termo do anúncio pago), separador " | ", nome curto do escritório. Máximo 60 chars. description: benefício principal que o visitante obtém + CTA suave (ex: "Analise seu caso."). 140-155 chars. Sem promessa de resultado.

IMPORTANTE: TODAS as manchetes preenchidas, com "em" sempre com um trecho real. Nunca deixe pre/em/post vazios.`;
}

export type GeneratedCopy = {
  copy: FocoCopy;
  imageQueries: { hero: string; dor: string; sobre: string; solucao: string };
};

/** Chama a OpenAI e retorna copy + imageQueries. Lança em caso de erro. */
export async function callOpenAiForCopy(
  apiKey: string,
  payload: CopyPayload,
): Promise<GeneratedCopy> {
  const client = new OpenAI({ apiKey });
  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 3000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: COPY_SYSTEM },
      { role: "user", content: buildCopyUserPrompt(payload) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as Record<string, unknown>;

  if (
    !parsed.hero ||
    !parsed.dor ||
    !parsed.solucao ||
    !parsed.areas ||
    !parsed.faq ||
    !parsed.ctaFinal
  ) {
    throw new Error("Copy incompleta retornada pela IA.");
  }

  const q = (parsed.imageQueries ?? {}) as Record<string, unknown>;
  const imageQueries = {
    hero: typeof q.hero === "string" ? q.hero : "",
    dor: typeof q.dor === "string" ? q.dor : "",
    sobre: typeof q.sobre === "string" ? q.sobre : "",
    solucao: typeof q.solucao === "string" ? q.solucao : "",
  };

  const s = (parsed.seo ?? {}) as Record<string, unknown>;
  const seo = {
    title: typeof s.title === "string" ? s.title.slice(0, 70) : "",
    description:
      typeof s.description === "string" ? s.description.slice(0, 165) : "",
  };

  delete parsed.imageQueries;
  delete parsed.seo;
  const copy: FocoCopy = { ...(parsed as unknown as FocoCopy), seo };

  return { copy, imageQueries };
}
