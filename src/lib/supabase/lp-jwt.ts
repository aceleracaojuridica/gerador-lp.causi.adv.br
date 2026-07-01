import "server-only";

import { createHmac } from "node:crypto";

type LpJwtClaims = {
  sub: string;
  account_id: number;
  access_level: number;
  role_slug: string;
};

function base64UrlEncode(input: string | Buffer): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf.toString("base64url");
}

/**
 * Emite JWT compatível com Supabase Auth para o Projeto B.
 * Claims customizados (`account_id`, `access_level`) são lidos pelas funções RLS.
 */
export function signLpUserJwt(
  claims: LpJwtClaims,
  jwtSecret: string,
  expiresInSeconds = 3600,
): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      aud: "authenticated",
      exp: now + expiresInSeconds,
      iat: now,
      iss: "supabase",
      sub: claims.sub,
      role: "authenticated",
      account_id: String(claims.account_id),
      access_level: String(claims.access_level),
      role_slug: claims.role_slug,
    }),
  );
  const signature = createHmac("sha256", jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}
