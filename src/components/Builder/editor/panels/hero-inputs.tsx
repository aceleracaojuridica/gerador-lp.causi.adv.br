"use client";

import { Add, Close } from "@material-symbols-svg/react";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import { IconPicker } from "../widgets/icon-picker";

const MAX_HERO_FEATURES = 3;

export function HeroFeaturesInput({ form }: { form: LpEditorForm }) {
  const features = form.office.heroFeatures ?? [];
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        Cards de destaque
      </p>
      <p className="mb-2 text-xs text-slate-400">
        Ícone + texto curto, exibidos abaixo do topo. Sem nenhum, a faixa não
        aparece. Até {MAX_HERO_FEATURES} cards.
      </p>
      <div className="flex flex-col gap-2">
        {features.map((f, i) => (
          <div
            key={`${f.icon}::${f.text}`}
            className="flex items-center gap-1.5"
          >
            <IconPicker
              value={f.icon}
              onChange={(key) => form.setHeroFeature(i, "icon", key)}
            />
            <Input
              aria-label={`Card ${i + 1} — texto`}
              value={f.text}
              onChange={(e) => form.setHeroFeature(i, "text", e.target.value)}
              placeholder="Ex: Atendimento próximo"
            />
            <button
              type="button"
              aria-label="Remover card"
              onClick={() => form.removeHeroFeature(i)}
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
            >
              <Close size={14} />
            </button>
          </div>
        ))}
      </div>
      {features.length < MAX_HERO_FEATURES ? (
        <button
          type="button"
          onClick={form.addHeroFeature}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar card
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_HERO_FEATURES} cards atingido.
        </p>
      )}
    </div>
  );
}

const MAX_METRICS = 3;

export function MetricsInput({ form }: { form: LpEditorForm }) {
  const metrics = form.office.metrics;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">Destaques</p>
      <p className="mb-2 text-xs text-slate-400">
        Ícone + texto curto. Sem nenhum, a faixa não aparece. Até {MAX_METRICS}.
      </p>
      <div className="flex flex-col gap-2">
        {metrics.map((m, i) => (
          <div
            key={`${m.icon}::${m.label}`}
            className="flex items-center gap-1.5"
          >
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
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
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
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar destaque
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_METRICS} destaques atingido.
        </p>
      )}
    </div>
  );
}

const MAX_DIFERENCIAIS = 4;

export function DiferenciaisInput({ form }: { form: LpEditorForm }) {
  const difs = form.office.diferenciais;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">
        Diferenciais (lista)
      </p>
      <p className="mb-2 text-xs text-slate-400">
        Pontos fortes exibidos ao lado da foto. Até {MAX_DIFERENCIAIS} itens.
      </p>
      <div className="flex flex-col gap-2">
        {difs.map((d, i) => (
          <div key={d} className="flex items-center gap-1.5">
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
              className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
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
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
        >
          <Add size={13} /> Adicionar diferencial
        </button>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Máximo de {MAX_DIFERENCIAIS} diferenciais atingido.
        </p>
      )}
    </div>
  );
}
