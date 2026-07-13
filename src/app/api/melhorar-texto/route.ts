import OpenAI from "openai";
import { getOpenAiChatModel, openAiTokenLimit } from "@/lib/env";
import { logExternalApiCall } from "@/lib/landing-pages/lp-external-api-log";
import type { Session } from "@/lib/session";
import { requireLpSession } from "@/lib/session";
import { sessionToLpContext } from "@/lib/supabase/lp-client";

// Endpoint que melhora um trecho de texto escrito pelo advogado (Sobre / diferencial)
// via API da OpenAI (GPT). Corrige português e aprimora a redação, mantendo os FATOS,
// sem inventar números/dados e respeitando a sobriedade da advocacia (Provimento OAB 205/2021).

export const runtime = "nodejs";

type Kind = "sobre" | "diferencial";

const INSTRUCOES: Record<Kind, string> = {
  sobre:
    'Este é o texto da seção "Sobre o escritório" de uma landing page jurídica. ' +
    "Reescreva em 2 a 4 frases, tom profissional, claro e acolhedor, em 1 ou 2 parágrafos curtos.",
  diferencial:
    "Este é um diferencial do escritório, exibido como item de lista numa landing page jurídica. " +
    "Reescreva como uma frase curta, direta e objetiva (no máximo ~12 palavras).",
};

const SYSTEM = [
  "Você é um redator jurídico brasileiro. Sua tarefa é CORRIGIR e APRIMORAR um texto curto escrito por um advogado para a landing page do escritório dele.",
  "Regras invioláveis:",
  "1. Escreva em português brasileiro, correto e fluente.",
  "2. NÃO invente fatos: nada de números, anos de experiência, quantidade de casos, taxas de sucesso, OAB, prêmios ou qualquer dado que não esteja no texto original.",
  "3. Sobriedade da advocacia (Provimento OAB 205/2021): sem promessa de resultado, sem sensacionalismo, sem 'ganhe sua causa', sem superlativos vazios ('o melhor', 'o número 1').",
  "4. Sem travessões. Mantenha o sentido e a intenção do autor.",
  "5. Responda APENAS com o texto melhorado, sem aspas, sem comentários, sem explicações.",
].join("\n");

export async function POST(request: Request) {
  let session: Session;
  try {
    session = await requireLpSession();
  } catch (err) {
    const forbidden = err instanceof Error && err.message === "FORBIDDEN";
    return Response.json(
      { error: forbidden ? "Sem acesso ao gerador." : "Não autenticado." },
      { status: forbidden ? 403 : 401 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "OPENAI_API_KEY não configurada no servidor (.env.local)." },
      { status: 503 },
    );
  }

  let body: {
    text?: string;
    kind?: Kind;
    office?: { name?: string; product?: string };
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const kind: Kind = body.kind === "diferencial" ? "diferencial" : "sobre";
  if (!text) {
    return Response.json({ error: "Texto vazio." }, { status: 400 });
  }

  const ctx =
    body.office?.name || body.office?.product
      ? `Contexto (apenas para tom, não cite literalmente): escritório "${body.office?.name ?? ""}", área "${body.office?.product ?? ""}".`
      : "";

  const lpCtx = sessionToLpContext(session);
  const log = {
    action: "UPDATE",
    context: "improve_text",
    accountId: lpCtx.accountId,
    createdByUserId: lpCtx.userId,
  };

  const messages = [
    { role: "system" as const, content: SYSTEM },
    {
      role: "user" as const,
      content: [INSTRUCOES[kind], ctx, "", "Texto original:", text]
        .filter(Boolean)
        .join("\n"),
    },
  ];
  const model = getOpenAiChatModel();
  const requestPayload = {
    model,
    ...openAiTokenLimit(model, 1024),
    messages,
  };

  const client = new OpenAI({ apiKey });
  const started = Date.now();

  try {
    const completion = await client.chat.completions.create(requestPayload);

    const melhorado = (completion.choices[0]?.message?.content ?? "").trim();

    if (!melhorado) {
      void logExternalApiCall({
        ...log,
        provider: "openai",
        operation: "chat.completions",
        requestPayload,
        durationMs: Date.now() - started,
        ok: false,
        error: "empty_response",
      });
      return Response.json(
        { error: "Resposta vazia do modelo." },
        { status: 502 },
      );
    }

    void logExternalApiCall({
      ...log,
      provider: "openai",
      operation: "chat.completions",
      requestPayload,
      responsePayload: { texto: melhorado },
      durationMs: Date.now() - started,
      ok: true,
    });

    return Response.json({ texto: melhorado });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao chamar a IA.";
    void logExternalApiCall({
      ...log,
      provider: "openai",
      operation: "chat.completions",
      requestPayload,
      durationMs: Date.now() - started,
      ok: false,
      error: msg,
    });
    return Response.json({ error: msg }, { status: 502 });
  }
}
