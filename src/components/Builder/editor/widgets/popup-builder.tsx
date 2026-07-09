"use client";

import { Add, Close, Delete } from "@material-symbols-svg/react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import {
  createPopupQuestion,
  POPUP_QUESTION_TYPE_LABELS,
  type PopupQuestionType,
} from "@/lib/landing-pages/popup/types";
import type { PopupQuestion } from "@/lib/landing-pages/schema";
import { BuilderField } from "../../shared/fields";

export function PopupBuilder({
  form,
  onClose,
}: {
  form: LpEditorForm;
  onClose: () => void;
}) {
  const questions: PopupQuestion[] =
    form.office.buttons?.popup?.questions ?? [];
  const update = (qs: PopupQuestion[]) => form.setPopupQuestions(qs);

  function addQ() {
    update([...questions, createPopupQuestion("text")]);
  }

  function replaceQ(i: number, next: PopupQuestion) {
    update(questions.map((q, idx) => (idx === i ? next : q)));
  }

  function setLabel(i: number, label: string) {
    const q = questions[i];
    if (!q) return;
    replaceQ(i, { ...q, label });
  }

  function setRequired(i: number, required: boolean) {
    const q = questions[i];
    if (!q) return;
    replaceQ(i, { ...q, required });
  }

  function setType(i: number, type: PopupQuestionType) {
    const q = questions[i];
    if (!q) return;
    replaceQ(
      i,
      createPopupQuestion(type, {
        id: q.id,
        label: q.label,
        required: q.required,
        ...(type === "choice" && q.type === "choice"
          ? { options: q.options, allowMultiple: q.allowMultiple }
          : {}),
        ...(type === "currency" && q.type === "currency"
          ? { currency: q.currency }
          : {}),
      }),
    );
  }

  function removeQ(i: number) {
    update(questions.filter((_, idx) => idx !== i));
  }

  function setOption(i: number, oi: number, v: string) {
    const q = questions[i];
    if (!q || q.type !== "choice") return;
    replaceQ(i, {
      ...q,
      options: q.options.map((o: string, k: number) => (k === oi ? v : o)),
    });
  }

  function addOption(i: number) {
    const q = questions[i];
    if (!q || q.type !== "choice") return;
    replaceQ(i, { ...q, options: [...q.options, ""] });
  }

  function removeOption(i: number, oi: number) {
    const q = questions[i];
    if (!q || q.type !== "choice") return;
    replaceQ(i, {
      ...q,
      options: q.options.filter((_o: string, k: number) => k !== oi),
    });
  }

  function setCurrency(i: number, currency: "BRL" | "USD" | "EUR") {
    const q = questions[i];
    if (!q || q.type !== "currency") return;
    replaceQ(i, { ...q, currency });
  }

  function setAllowMultiple(i: number, allowMultiple: boolean) {
    const q = questions[i];
    if (!q || q.type !== "choice") return;
    replaceQ(i, { ...q, allowMultiple });
  }

  function handleBackdropKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") onClose();
  }

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-builder-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
    >
      <div className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2
              id="popup-builder-title"
              className="text-sm font-semibold text-slate-900"
            >
              Personalizar formulário
            </h2>
            <p className="text-xs text-ui-gray">
              Perguntas antes do passo de nome e telefone
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
          >
            <Close size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {questions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-xs text-slate-400">
              Nenhuma pergunta ainda. O popup abre direto no nome e telefone.
            </p>
          ) : null}

          {questions.map((q, i) => (
            <div
              key={q.id}
              className="space-y-3 rounded-lg border border-slate-200 p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                  Pergunta {i + 1}
                </span>
                <button
                  type="button"
                  aria-label="Remover pergunta"
                  onClick={() => removeQ(i)}
                  className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-red-600"
                >
                  <Delete size={14} />
                </button>
              </div>
              <BuilderField
                label="Pergunta"
                hint="O que o visitante vê antes de responder."
              >
                <Input
                  aria-label={`Pergunta ${i + 1}`}
                  value={q.label}
                  onChange={(e) => setLabel(i, e.target.value)}
                  placeholder="Ex: Qual a sua situação hoje?"
                />
              </BuilderField>
              <BuilderField label="Tipo de resposta">
                <select
                  aria-label={`Tipo da pergunta ${i + 1}`}
                  value={q.type}
                  onChange={(e) =>
                    setType(i, e.target.value as PopupQuestionType)
                  }
                >
                  {(
                    Object.entries(POPUP_QUESTION_TYPE_LABELS) as [
                      PopupQuestionType,
                      string,
                    ][]
                  ).map(([type, label]) => (
                    <option key={type} value={type}>
                      {label}
                    </option>
                  ))}
                </select>
              </BuilderField>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Obrigatório</span>
                <button
                  type="button"
                  onClick={() => setRequired(i, q.required === false)}
                  className={`rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                    q.required !== false
                      ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {q.required !== false ? "Sim" : "Não"}
                </button>
              </div>
              {q.type === "currency" ? (
                <BuilderField label="Moeda">
                  <select
                    aria-label={`Moeda da pergunta ${i + 1}`}
                    value={q.currency}
                    onChange={(e) =>
                      setCurrency(i, e.target.value as "BRL" | "USD" | "EUR")
                    }
                  >
                    <option value="BRL">Real (BRL)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                  </select>
                </BuilderField>
              ) : null}
              {q.type === "choice" ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                      Várias respostas
                    </span>
                    <button
                      type="button"
                      onClick={() => setAllowMultiple(i, !q.allowMultiple)}
                      className={`rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                        q.allowMultiple
                          ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {q.allowMultiple ? "Sim" : "Não"}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-slate-700">Opções</p>
                    {q.options.map((opt, oi) => (
                      <div
                        key={`${q.id}-opt-${oi}`}
                        className="flex items-center gap-1.5"
                      >
                        <Input
                          aria-label={`Opção ${oi + 1}`}
                          value={opt}
                          onChange={(e) => setOption(i, oi, e.target.value)}
                          placeholder={`Opção ${oi + 1}`}
                        />
                        <button
                          type="button"
                          aria-label="Remover opção"
                          onClick={() => removeOption(i, oi)}
                          className="shrink-0 rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                        >
                          <Close size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(i)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 py-1.5 text-xs font-medium text-ui transition hover:bg-ui-hover"
                    >
                      <Add size={13} /> Adicionar opção
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          ))}

          <button
            type="button"
            onClick={addQ}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-ui-hover"
          >
            <Add size={16} /> Adicionar pergunta
          </button>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
              Passo final (fixo)
            </span>
            <p className="mt-1 text-xs text-slate-500">
              Nome e telefone são sempre o último passo. Use os tipos acima para
              coletar e-mail, valor, localização e outros dados.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-ui px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ui-dark"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
