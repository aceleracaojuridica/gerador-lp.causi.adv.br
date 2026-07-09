import "server-only";

import { getSupabasePublicEnv } from "@/lib/env";

const CHECK_OFFICE_SUBDOMAIN_FUNCTION = "check-office-subdomain";

type CheckOfficeSubdomainResponse = {
  available: boolean;
};

/**
 * Consulta o Causi (Edge Function) se o subdomínio pode ser usado pela conta.
 * A lógica de reserva por nome/slug de outras contas roda no Projeto A.
 */
export async function fetchCausiOfficeSubdomainAvailability(input: {
  accessToken: string;
  subdomain: string;
  accountId: number;
}): Promise<boolean> {
  const { url, key } = getSupabasePublicEnv();
  const endpoint = `${url}/functions/v1/${CHECK_OFFICE_SUBDOMAIN_FUNCTION}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subdomain: input.subdomain,
      account_id: input.accountId,
    }),
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error("UNAUTHENTICATED");
  }

  if (!response.ok) {
    throw new Error(
      `Falha ao validar subdomínio no Causi (${response.status}).`,
    );
  }

  const payload = (await response.json()) as CheckOfficeSubdomainResponse;
  return payload.available === true;
}
