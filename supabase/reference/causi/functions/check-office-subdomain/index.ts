/**
 * Valida se um subdomínio de LP pode ser usado, consultando public.accounts
 * sem expor o banco Causi ao gerador de landing pages (Projeto B).
 *
 * POST /functions/v1/check-office-subdomain
 * Authorization: Bearer <jwt_usuario>
 * { "subdomain": "walesam-advogados", "account_id": 42 }
 */
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FORBIDDEN_SUBDOMAINS = new Set(["causi"]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Espelha generate_slug() do Postgres para detectar colisão por nome. */
function slugFromOfficeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const accessToken = authHeader.slice("Bearer ".length).trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let body: { subdomain?: string; account_id?: number };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const subdomain = body.subdomain?.trim().toLowerCase() ?? "";
  const accountId = Number(body.account_id);

  if (!subdomain || !Number.isInteger(accountId) || accountId <= 0) {
    return jsonResponse({ error: "Invalid input" }, 400);
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: canAccess, error: accessError } = await admin.rpc(
    "is_user_in_account_or_shared",
    { target_account_id: accountId, p_user_id: user.id },
  );

  if (accessError) {
    return jsonResponse({ error: "Database error" }, 500);
  }

  if (!canAccess) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  if (FORBIDDEN_SUBDOMAINS.has(subdomain)) {
    return jsonResponse({ available: false });
  }

  // ponytail: scan O(n) em accounts; upgrade path: índice em slug + coluna base_slug
  const { data: accounts, error: accountsError } = await admin
    .from("accounts")
    .select("id,name,slug")
    .neq("id", accountId);

  if (accountsError) {
    return jsonResponse({ error: "Database error" }, 500);
  }

  const takenByNameOrSlug = (accounts ?? []).some((row) => {
    const name = row.name ?? "";
    const slug = row.slug ?? "";
    return slugFromOfficeName(name) === subdomain || slug === subdomain;
  });

  return jsonResponse({ available: !takenByNameOrSlug });
});
