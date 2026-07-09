export type ViaCepAddress = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
  pais: string;
};

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

/** Busca endereço pelo CEP (apenas dígitos, 8 caracteres). */
export async function fetchAddressByCep(
  cepDigits: string,
): Promise<ViaCepAddress | null> {
  const digits = cepDigits.replace(/\D/g, "");
  if (digits.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!res.ok) return null;

  const data = (await res.json()) as ViaCepResponse;
  if (data.erro) return null;

  return {
    cep: data.cep ?? digits.replace(/(\d{5})(\d{3})/, "$1-$2"),
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade ?? "",
    uf: data.uf ?? "",
    pais: "Brasil",
  };
}

/** Serializa endereço CEP para gravar em answers. */
export function serializeCepAnswer(addr: ViaCepAddress): string {
  return JSON.stringify(addr);
}

/** Formata valor CEP armazenado para exibição no dashboard. */
export function formatCepAnswerDisplay(raw: string): string {
  try {
    const data = JSON.parse(raw) as ViaCepAddress;
    const cep = data.cep ?? "";
    const cidade = data.cidade ?? "";
    const uf = data.uf ?? "";
    if (cidade && uf) return `${cep} · ${cidade}/${uf}`;
    return cep || raw;
  } catch {
    return raw;
  }
}
