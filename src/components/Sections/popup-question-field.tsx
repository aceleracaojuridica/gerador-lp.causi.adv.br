"use client";

import { ArrowForward } from "@material-symbols-svg/react";
import { useEffect, useState } from "react";
import { InputMask } from "@/components/ui/input-mask";
import { type CurrencyCode, formatDecimalCurrency } from "@/lib/formatters";
import type { PopupQuestion } from "@/lib/landing-pages/popup/types";
import {
  joinChoiceValues,
  parseChoiceValues,
} from "@/lib/landing-pages/popup/validation";
import {
  fetchAddressByCep,
  serializeCepAnswer,
} from "@/lib/landing-pages/popup/viacep";

const inputCls =
  "w-full rounded-[5px] border border-lp-ink-soft/20 px-4 py-3 text-sm text-lp-ink outline-none transition focus:border-lp-accent";

type PopupQuestionFieldProps = {
  question: PopupQuestion;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  /** Escolha única: avança ao selecionar. */
  onChoiceSelect?: (value: string) => void;
};

export function PopupQuestionField({
  question,
  value,
  onChange,
  error,
  onChoiceSelect,
}: PopupQuestionFieldProps) {
  switch (question.type) {
    case "choice":
      return (
        <ChoiceField
          question={question}
          value={value}
          onChange={onChange}
          onChoiceSelect={onChoiceSelect}
        />
      );
    case "cep":
      return (
        <CepField
          question={question}
          value={value}
          onChange={onChange}
          error={error}
        />
      );
    case "phone":
      return (
        <InputMask
          mask="(00) 00000-0000"
          className={inputCls}
          value={value}
          onAccept={(v: string) => onChange(v)}
          placeholder="(00) 00000-0000"
          inputMode="tel"
          aria-label={question.label || "Telefone"}
        />
      );
    case "currency":
      return (
        <CurrencyField
          currency={question.currency}
          value={value}
          onChange={onChange}
        />
      );
    case "email":
      return (
        <input
          type="email"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="seu@email.com"
          inputMode="email"
          aria-label={question.label || "E-mail"}
        />
      );
    case "url":
      return (
        <input
          type="url"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://"
          inputMode="url"
          aria-label={question.label || "URL"}
        />
      );
    case "number":
      return (
        <input
          type="text"
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          inputMode="decimal"
          aria-label={question.label || "Número"}
        />
      );
    default:
      return (
        <textarea
          aria-label={question.label || "Resposta"}
          className={`min-h-[110px] resize-y ${inputCls}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Sua resposta"
        />
      );
  }
}

function CurrencyField({
  currency,
  value,
  onChange,
}: {
  currency: CurrencyCode;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      className={inputCls}
      value={value}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        if (!digits) {
          onChange("");
          return;
        }
        const num = Number.parseInt(digits, 10) / 100;
        onChange(formatDecimalCurrency(num, currency));
      }}
      placeholder="0,00"
      inputMode="decimal"
      aria-label="Valor"
    />
  );
}

function CepField({
  question,
  value,
  onChange,
  error,
}: {
  question: PopupQuestion;
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const [cepInput, setCepInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cepError, setCepError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setCepInput("");
      setPreview(null);
      return;
    }
    try {
      const data = JSON.parse(value) as {
        cep?: string;
        cidade?: string;
        uf?: string;
        pais?: string;
      };
      if (data.cep) setCepInput(data.cep);
      if (data.cidade && data.uf) {
        setPreview(`${data.cidade}/${data.uf} · ${data.pais ?? "Brasil"}`);
      }
    } catch {
      setCepInput(value);
    }
  }, [value]);

  async function onCepAccept(masked: string) {
    setCepInput(masked);
    const digits = masked.replace(/\D/g, "");
    if (digits.length < 8) {
      setPreview(null);
      setCepError(null);
      onChange("");
      return;
    }
    if (digits.length > 8) return;

    setLoading(true);
    setCepError(null);
    const addr = await fetchAddressByCep(digits);
    setLoading(false);

    if (!addr) {
      setCepError("CEP não encontrado.");
      setPreview(null);
      onChange("");
      return;
    }

    onChange(serializeCepAnswer(addr));
    setPreview(`${addr.cidade}/${addr.uf} · ${addr.pais}`);
  }

  return (
    <div className="space-y-2">
      <InputMask
        mask="00000-000"
        className={inputCls}
        value={cepInput}
        onAccept={(v: string) => {
          void onCepAccept(v);
        }}
        placeholder="00000-000"
        inputMode="numeric"
        aria-label={question.label || "CEP"}
      />
      {loading ? (
        <p className="text-xs text-lp-ink-soft">Buscando endereço…</p>
      ) : null}
      {preview ? (
        <p className="text-xs font-medium text-lp-brand">{preview}</p>
      ) : null}
      {cepError || error ? (
        <p className="text-xs text-destructive">{cepError ?? error}</p>
      ) : null}
    </div>
  );
}

function ChoiceField({
  question,
  value,
  onChange,
  onChoiceSelect,
}: {
  question: PopupQuestion & { type: "choice" };
  value: string;
  onChange: (v: string) => void;
  onChoiceSelect?: (v: string) => void;
}) {
  const options = question.options.filter((o) => o.trim());
  const allowMultiple = !!question.allowMultiple;
  const selected = parseChoiceValues(value);

  if (allowMultiple) {
    return (
      <div className="mt-5 space-y-2">
        {options.map((opt) => {
          const isOn = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => {
                const next = isOn
                  ? selected.filter((s) => s !== opt)
                  : [...selected, opt];
                onChange(joinChoiceValues(next));
              }}
              className={`flex w-full items-center justify-between rounded-[5px] border px-4 py-3 text-left text-sm font-medium transition ${
                isOn
                  ? "border-lp-accent bg-lp-accent/10 text-lp-brand"
                  : "border-lp-ink-soft/20 text-lp-ink hover:border-lp-accent/60 hover:bg-lp-accent/5"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      {options.map((opt) => {
        const isSelected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => {
              onChange(opt);
              onChoiceSelect?.(opt);
            }}
            className={`flex w-full items-center justify-between rounded-[5px] border px-4 py-3 text-left text-sm font-medium transition ${
              isSelected
                ? "border-lp-accent bg-lp-accent/10 text-lp-brand"
                : "border-lp-ink-soft/20 text-lp-ink hover:border-lp-accent/60 hover:bg-lp-accent/5"
            }`}
          >
            {opt}
            <ArrowForward size={15} className="text-lp-accent" />
          </button>
        );
      })}
    </div>
  );
}
