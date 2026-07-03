"use client";

import {
  CityCombobox,
  StateCombobox,
} from "@/components/ui-patterns/location-combobox";

/**
 * Seletor Estado → Cidade em cascata (IBGE via country-state-city).
 * Versão controlada para uso fora de React Hook Form.
 */
export function EstadoCidade({
  uf,
  cidade,
  onChange,
}: {
  uf: string;
  cidade: string;
  onChange: (uf: string, cidade: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <StateCombobox
        countryCode="BR"
        value={uf || null}
        onValueChange={(val) => onChange(val ?? "", "")}
        showClear
        placeholder="Selecione o Estado"
      />
      <CityCombobox
        countryCode="BR"
        stateCode={uf || undefined}
        value={cidade || null}
        onValueChange={(val) => onChange(uf, val ?? "")}
        showClear
        disabled={!uf}
        placeholder={uf ? "Selecione a Cidade" : "Selecione o Estado primeiro"}
      />
    </div>
  );
}
