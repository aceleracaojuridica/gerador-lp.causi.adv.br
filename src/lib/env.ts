import { z } from "zod";

const supabaseUrl = z.url({
  protocol: /^https$/,
  hostname: /^[a-z0-9]+\.supabase\.co$/,
});

const optionalSecret = z
  .string()
  .optional()
  .transform((value) => value?.trim() || undefined);

const publicEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_DOMAIN: z.string().min(1),
});

const serverEnvSchema = z
  .object({
    APP_URL: z.string().min(1).optional(),
    LP_SUPABASE_URL: supabaseUrl,
    LP_SUPABASE_ANON_KEY: z.string().min(1),
    LP_SUPABASE_JWT_SECRET: z.string().min(1),
    LP_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    OPENAI_API_KEY: optionalSecret,
    OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
    UNSPLASH_ACCESS_KEY: optionalSecret,
  })
  .transform((values) => ({
    ...values,
    APP_URL: values.APP_URL?.trim() || "http://localhost:3000",
  }));

const runtimePublicEnv = {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_APP_DOMAIN: process.env.NEXT_PUBLIC_APP_DOMAIN,
};

const runtimeServerEnv = {
  APP_URL: process.env.APP_URL,
  LP_SUPABASE_URL: process.env.LP_SUPABASE_URL,
  LP_SUPABASE_ANON_KEY: process.env.LP_SUPABASE_ANON_KEY,
  LP_SUPABASE_JWT_SECRET: process.env.LP_SUPABASE_JWT_SECRET,
  LP_SUPABASE_SERVICE_ROLE_KEY: process.env.LP_SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
};

const publicEnv = publicEnvSchema.parse(runtimePublicEnv);
const parsedServerEnv =
  typeof window === "undefined"
    ? serverEnvSchema.parse(runtimeServerEnv)
    : null;

export const env = { ...publicEnv, ...(parsedServerEnv ?? {}) };
export type AppEnv = typeof env;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/** Apenas servidor — Route Handlers, Server Actions, RSC */
export function getServerEnv(): ServerEnv {
  if (!parsedServerEnv) {
    throw new Error("getServerEnv() is only available on the server.");
  }
  return parsedServerEnv;
}

/** Origin do app para callbacks de auth (`APP_URL` com ou sem protocolo). */
export function getAppOrigin(): string {
  const server = getServerEnv();
  const raw = server.APP_URL.trim();

  if (/^https?:\/\//i.test(raw)) {
    return new URL(raw).origin;
  }

  if (raw.includes("localhost")) {
    return raw.includes(":") ? `http://${raw}` : `http://${raw}:3000`;
  }

  const host = raw.replace(/^\/+/, "").split("/")[0] ?? raw;
  return `https://${host}`;
}

/** URL e chave pública do Supabase Auth (projeto Causi). */
export function getSupabasePublicEnv() {
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** URL e service role do Supabase de LPs (projeto B). */
export function getLpAdminEnv() {
  const server = getServerEnv();
  return {
    url: server.LP_SUPABASE_URL,
    key: server.LP_SUPABASE_SERVICE_ROLE_KEY,
  };
}

/** URL, anon key e JWT secret do Supabase de LPs (cliente com RLS). */
export function getLpUserEnv() {
  const server = getServerEnv();
  return {
    url: server.LP_SUPABASE_URL,
    anonKey: server.LP_SUPABASE_ANON_KEY,
    jwtSecret: server.LP_SUPABASE_JWT_SECRET,
  };
}

/** Host do app sem protocolo — usado no middleware para subdomínios de LP. */
export function getAppDomain(): string {
  const server = getServerEnv();
  return server.APP_URL.replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}
