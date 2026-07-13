import "server-only";

/*
  Auditoria best-effort de chamadas a APIs externas (OpenAI, Unsplash, …).
  Nunca lança — falha de log não afeta o fluxo de negócio.
*/
import { lpAdmin } from "@/lib/supabase/admin";

const MAX_STRING_CHARS = 8_000;

/** Metadados de origem/ação passados pelos callers (convenção, não enum no DB). */
export type ExternalApiLogMeta = {
  action: string;
  context: string;
  accountId?: number;
  createdByUserId?: string;
  landingPageId?: string | null;
};

export type LogExternalApiCallInput = ExternalApiLogMeta & {
  provider: string;
  operation: string;
  requestPayload?: unknown;
  responsePayload?: unknown;
  statusCode?: number;
  durationMs?: number;
  ok: boolean;
  error?: string | null;
};

function isDataUrl(value: string): boolean {
  return /^data:[^;]+;base64,/i.test(value);
}

/** Remove base64/data URLs e trunca strings longas para não explodir o JSONB. */
export function sanitizeForExternalApiLog(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === "string") {
    if (isDataUrl(value)) {
      return { _omitted: "data_url", length: value.length };
    }
    if (value.length > MAX_STRING_CHARS) {
      return {
        _omitted: "truncated",
        length: value.length,
        preview: value.slice(0, MAX_STRING_CHARS),
      };
    }
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForExternalApiLog(item));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const lower = key.toLowerCase();
      if (
        lower.includes("api_key") ||
        lower.includes("apikey") ||
        lower === "authorization" ||
        lower === "password" ||
        lower === "secret"
      ) {
        out[key] = { _omitted: "secret" };
        continue;
      }
      out[key] = sanitizeForExternalApiLog(nested);
    }
    return out;
  }
  return String(value);
}

/**
 * Persiste uma linha em `lp_external_api_logs` via service_role.
 * Fire-and-forget seguro: engole erros.
 */
export async function logExternalApiCall(
  input: LogExternalApiCallInput,
): Promise<void> {
  try {
    const row = {
      account_id: input.accountId ?? null,
      created_by_user_id: input.createdByUserId ?? null,
      landing_page_id: input.landingPageId ?? null,
      provider: input.provider,
      operation: input.operation,
      action: input.action,
      context: input.context,
      request_payload: sanitizeForExternalApiLog(input.requestPayload ?? {}),
      response_payload:
        input.responsePayload === undefined
          ? null
          : sanitizeForExternalApiLog(input.responsePayload),
      status_code: input.statusCode ?? null,
      duration_ms: input.durationMs ?? null,
      ok: input.ok,
      error: input.error ?? null,
    };

    const { error } = await lpAdmin().from("lp_external_api_logs").insert(row);

    if (error) {
      console.error("[lp_external_api_logs] insert failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[lp_external_api_logs] unexpected:",
      err instanceof Error ? err.message : err,
    );
  }
}

/** Convenience: cronometra e loga um round-trip externo. */
export async function withExternalApiLog<T>(
  meta: Omit<
    LogExternalApiCallInput,
    "ok" | "error" | "durationMs" | "responsePayload" | "statusCode"
  > & {
    requestPayload?: unknown;
  },
  run: () => Promise<{
    result: T;
    responsePayload?: unknown;
    statusCode?: number;
  }>,
): Promise<T> {
  const started = Date.now();
  try {
    const { result, responsePayload, statusCode } = await run();
    void logExternalApiCall({
      ...meta,
      ok: true,
      statusCode,
      responsePayload,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    void logExternalApiCall({
      ...meta,
      ok: false,
      error: message,
      durationMs: Date.now() - started,
    });
    throw err;
  }
}
