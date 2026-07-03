"use client";

import { Add, Close, Delete } from "@material-symbols-svg/react";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { PopupQuestion } from "@/lib/landing-pages/schema";
import { BuilderField } from "../../shared/fields";

export function PopupBuilder({
  form,
  onClose,
}: {
  form: LpEditorForm;
  onClose: () => void;
}) {
  const questions = form.office.buttons?.popup?.questions ?? [];
  const update = (qs: PopupQuestion[]) => form.setPopupQuestions(qs);

  function addQ() {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `q-${Math.random().toString(36).slice(2)}`;
    update([...questions, { id, label: "", type: "text", options: [] }]);
  }
  function setField(i: number, patch: Partial<PopupQuestion>) {
    update(questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function removeQ(i: number) {
    update(questions.filter((_, idx) => idx !== i));
  }
  function setOption(i: number, oi: number, v: string) {
    update(
      questions.map((q, idx) =>
        idx === i
          ? { ...q, options: q.options.map((o, k) => (k === oi ? v : o)) }
          : q,
      ),
    );
  }
  function addOption(i: number) {
    update(
      questions.map((q, idx) =>
        idx === i ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }
  function removeOption(i: number, oi: number) {
    update(
      questions.map((q, idx) =>
        idx === i ? { ...q, options: q.options.filter((_, k) => k !== oi) } : q,
      ),
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
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
                  onChange={(e) => setField(i, { label: e.target.value })}
                  placeholder="Ex: Qual a sua situação hoje?"
                />
              </BuilderField>
              <BuilderField label="Tipo de resposta">
                <select
                  aria-label={`Tipo da pergunta ${i + 1}`}
                  value={q.type}
                  onChange={(e) =>
                    setField(i, {
                      type: e.target.value as PopupQuestion["type"],
                    })
                  }
                >
                  <option value="text">Resposta livre</option>
                  <option value="choice">Múltipla escolha</option>
                </select>
              </BuilderField>
              {q.type === "choice" ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-slate-700">Opções</p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1.5">
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

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3 space-y-3">
            <div>
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
                Passo final (fixo)
              </span>
              <p className="mt-1 text-xs text-slate-500">
                Nome e telefone — sempre aparecem no fim.
              </p>
            </div>
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700">
                  Campo de e-mail
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const current = form.office.buttons?.popup?.email;
                    form.setPopupEmail(
                      current?.enabled
                        ? undefined
                        : { enabled: true, required: false },
                    );
                  }}
                  className={`rounded-[5px] px-2 py-0.5 text-[0.7rem] font-semibold transition ${
                    form.office.buttons?.popup?.email?.enabled
                      ? "bg-[#e4f7e5] text-[#1b961f] hover:bg-[#d3f1d5]"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {form.office.buttons?.popup?.email?.enabled
                    ? "Ativo"
                    : "Inativo"}
                </button>
              </div>
              {form.office.buttons?.popup?.email?.enabled ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Preenchimento</span>
                  <div className="inline-flex gap-0.5 rounded-lg border border-slate-200 p-0.5">
                    {(
                      [
                        { id: false, label: "Opcional" },
                        { id: true, label: "Obrigatório" },
                      ] as const
                    ).map(({ id, label }) => {
                      const active =
                        (form.office.buttons?.popup?.email?.required ??
                          false) === id;
                      return (
                        <button
                          key={String(id)}
                          type="button"
                          onClick={() =>
                            form.setPopupEmail({ enabled: true, required: id })
                          }
                          className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                            active
                              ? "bg-ui-soft text-ui"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
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
