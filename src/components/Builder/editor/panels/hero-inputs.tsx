"use client";

import { Add, Close } from "@material-symbols-svg/react";
import {
  HERO_BAND_MAX_ITEMS,
  HERO_BAND_MIN_ITEMS,
} from "@/components/Sections/hero";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { useStableListKeys } from "../use-stable-list-keys";
import { IconPicker } from "../widgets/icon-picker";

export function HeroFeaturesInput({ form }: { form: LpEditorForm }) {
  const features = form.office.heroFeatures ?? [];
  // Key derivada do texto digitado remonta o input a cada tecla e derruba o
  // foco: a key precisa ser estável por posição.
  const featureKeys = useStableListKeys(
    features,
    (f) => `${f.icon}::${f.text}`,
    "hero-feature",
  );
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">
        Faixa de destaques
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        Textos curtos exibidos na faixa colada na base do topo. De{" "}
        {HERO_BAND_MIN_ITEMS} a {HERO_BAND_MAX_ITEMS} itens; com menos de{" "}
        {HERO_BAND_MIN_ITEMS} a faixa não aparece.
      </p>
      <div className="flex flex-col gap-2">
        {features.map((f, i) => (
          <div key={featureKeys[i]} className="flex items-center gap-1.5">
            <Input
              aria-label={`Destaque ${i + 1}`}
              value={f.text}
              onChange={(e) => form.setHeroFeature(i, "text", e.target.value)}
              placeholder="Ex: Atendimento nacional"
            />
            <button
              type="button"
              aria-label="Remover destaque"
              disabled={features.length <= HERO_BAND_MIN_ITEMS}
              onClick={() => form.removeHeroFeature(i)}
              className="shrink-0 rounded-lg px-1.5 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {features.length < HERO_BAND_MAX_ITEMS ? (
        <button
          type="button"
          onClick={form.addHeroFeature}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
        >
          <Add size={13} /> Adicionar destaque
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Máximo de {HERO_BAND_MAX_ITEMS} itens atingido.
        </p>
      )}
    </div>
  );
}

const MAX_METRICS = 3;

export function MetricsInput({ form }: { form: LpEditorForm }) {
  const metrics = form.office.metrics;
  const metricKeys = useStableListKeys(
    metrics,
    (m) => `${m.icon}::${m.label}`,
    "metric",
  );
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">Destaques</p>
      <p className="mb-2 text-xs text-muted-foreground">
        Ícone + texto curto. Sem nenhum, a faixa não aparece. Até {MAX_METRICS}.
      </p>
      <div className="flex flex-col gap-2">
        {metrics.map((m, i) => (
          <div key={metricKeys[i]} className="flex items-center gap-1.5">
            <IconPicker
              value={m.icon}
              onChange={(key) => form.setMetric(i, "icon", key)}
            />
            <Input
              aria-label={`Destaque ${i + 1} — texto`}
              value={m.label}
              onChange={(e) => form.setMetric(i, "label", e.target.value)}
              placeholder="Ex: anos de atuação"
            />
            <button
              type="button"
              aria-label="Remover destaque"
              onClick={() => form.removeMetric(i)}
              className="shrink-0 rounded-lg px-1.5 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {metrics.length < MAX_METRICS ? (
        <button
          type="button"
          onClick={form.addMetric}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
        >
          <Add size={13} /> Adicionar destaque
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Máximo de {MAX_METRICS} destaques atingido.
        </p>
      )}
    </div>
  );
}

const MAX_DIFERENCIAIS = 4;

export function DiferenciaisInput({ form }: { form: LpEditorForm }) {
  const difs = form.office.diferenciais;
  // A key era o próprio texto: além de remontar a cada tecla, dois diferenciais
  // iguais (ou dois vazios) colidiam.
  const difKeys = useStableListKeys(difs, (d) => d, "diferencial");
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-foreground">
        Diferenciais (lista)
      </p>
      <p className="mb-2 text-xs text-muted-foreground">
        Pontos fortes exibidos ao lado da foto. Até {MAX_DIFERENCIAIS} itens.
      </p>
      <div className="flex flex-col gap-2">
        {difs.map((d, i) => (
          <div key={difKeys[i]} className="flex items-center gap-1.5">
            <Input
              aria-label={`Diferencial ${i + 1}`}
              value={d}
              onChange={(e) => form.setDiferencial(i, e.target.value)}
              placeholder={`Diferencial ${i + 1}`}
            />
            <button
              type="button"
              aria-label="Remover diferencial"
              onClick={() => form.removeDiferencial(i)}
              className="shrink-0 rounded-lg px-1.5 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {difs.length < MAX_DIFERENCIAIS ? (
        <button
          type="button"
          onClick={form.addDiferencial}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
        >
          <Add size={13} /> Adicionar diferencial
        </button>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Máximo de {MAX_DIFERENCIAIS} diferenciais atingido.
        </p>
      )}
    </div>
  );
}
