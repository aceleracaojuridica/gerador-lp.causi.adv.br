"use client";

import { useEffect, useState } from "react";
import { inputCls } from "./fields";

// Seletor Estado → Cidade em cascata. Os estados (UF) são fixos; as cidades
// vêm da API oficial do IBGE (grátis, sem chave) conforme o estado escolhido.
// A cidade fica desabilitada até escolher o estado. Devolve (uf, cidade) ao pai.

const UFS: { sigla: string; nome: string }[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

export function EstadoCidade({
  uf,
  cidade,
  onChange,
}: {
  uf: string;
  cidade: string;
  onChange: (uf: string, cidade: string) => void;
}) {
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Busca as cidades do estado selecionado no IBGE. Falha silenciosa (degrada
  // para lista vazia) — sem chave e com CORS liberado pela API oficial.
  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    let alive = true;
    setLoading(true);
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    )
      .then((r) => r.json())
      .then((data: { nome: string }[]) => {
        if (alive) setCities(data.map((d) => d.nome));
      })
      .catch(() => {
        if (alive) setCities([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [uf]);

  const cityCls = `${inputCls} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`;

  return (
    <div className="grid grid-cols-2 gap-2">
      <select
        aria-label="Estado"
        className={inputCls}
        value={uf}
        onChange={(e) => onChange(e.target.value, "")}
      >
        <option value="">Selecione o Estado</option>
        {UFS.map((u) => (
          <option key={u.sigla} value={u.sigla}>
            {u.nome}
          </option>
        ))}
      </select>
      <select
        aria-label="Cidade"
        className={cityCls}
        value={cidade}
        disabled={!uf || loading}
        onChange={(e) => onChange(uf, e.target.value)}
      >
        <option value="">
          {!uf
            ? "Selecione a Cidade"
            : loading
              ? "Carregando…"
              : "Selecione a Cidade"}
        </option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
}
