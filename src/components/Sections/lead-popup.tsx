"use client";

import {
  ArrowBack,
  ArrowForward,
  Check,
  Close,
} from "@material-symbols-svg/react";
import { useEffect, useState } from "react";
import type { PopupQuestion } from "@/lib/landing-pages/schema";

/**
 * Popup de lead. Mostra as perguntas personalizadas (uma por vez) e, no final,
 * sempre o passo simples com nome + telefone. No preview é ilustrativo: o
 * "Enviar" só mostra um agradecimento (a captura real vem na publicação).
 */
export function LeadPopup({
  open,
  onClose,
  questions,
  emailConfig,
  demo = false,
}: {
  open: boolean;
  onClose: () => void;
  questions: PopupQuestion[];
  emailConfig?: { enabled: boolean; required: boolean };
  demo?: boolean; // no preview do editor: avisa que é só demonstração
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lead, setLead] = useState({ nome: "", telefone: "", email: "" });
  const [sent, setSent] = useState(false);

  // Ao abrir, reinicia o fluxo.
  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
      setLead({ nome: "", telefone: "", email: "" });
      setSent(false);
    }
  }, [open]);

  if (!open) return null;

  const total = questions.length + 1; // perguntas + passo final
  const isFinal = step >= questions.length;
  const q = questions[step];

  function next() {
    setStep((s) => Math.min(total - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-[5px] bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo: voltar (a partir da 2ª etapa) + fechar */}
        <div className="mb-3 flex items-center justify-between">
          {step > 0 && !sent ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-xs font-semibold text-ink-soft transition hover:bg-black/5 hover:text-brand"
            >
              <ArrowBack size={16} /> Voltar
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-1 text-ink-soft transition hover:bg-black/5"
          >
            <Close size={18} />
          </button>
        </div>

        {/* Barra de progresso */}
        {!sent ? (
          <div className="mb-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cream-deep">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-ink-soft">
              Etapa {step + 1} de {total}
            </p>
          </div>
        ) : null}

        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Check size={28} />
            </span>
            <h3 className="font-display text-xl font-bold text-brand">
              Recebemos seu contato!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Em breve entraremos em contato. Obrigado!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-[5px] bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
            >
              Fechar
            </button>
          </div>
        ) : isFinal ? (
          // ----- Passo final fixo: nome + telefone -----
          <div>
            <h3 className="font-display text-xl font-bold text-brand">
              Quase lá! Deixe seu contato
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              Preencha para falarmos com você.
            </p>
            <div className="mt-5 space-y-3">
              <input
                aria-label="Nome"
                className="w-full rounded-[5px] border border-ink-soft/20 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                value={lead.nome}
                onChange={(e) =>
                  setLead((l) => ({ ...l, nome: e.target.value }))
                }
                placeholder="Seu nome"
                required
              />
              <input
                aria-label="Telefone"
                className="w-full rounded-[5px] border border-ink-soft/20 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                value={lead.telefone}
                onChange={(e) =>
                  setLead((l) => ({ ...l, telefone: e.target.value }))
                }
                placeholder="(00) 00000-0000"
                inputMode="tel"
                required
              />
              {emailConfig?.enabled ? (
                <input
                  aria-label="E-mail"
                  className="w-full rounded-[5px] border border-ink-soft/20 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                  value={lead.email}
                  onChange={(e) =>
                    setLead((l) => ({ ...l, email: e.target.value }))
                  }
                  placeholder={
                    emailConfig.required
                      ? "Seu e-mail"
                      : "Seu e-mail (opcional)"
                  }
                  inputMode="email"
                  required={emailConfig.required}
                />
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSent(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[5px] bg-accent px-5 py-3 text-sm font-bold text-[var(--color-accent-ink)] transition hover:bg-accent-soft"
            >
              Enviar
            </button>
          </div>
        ) : (
          // ----- Pergunta personalizada -----
          <div>
            <h3 className="font-display text-xl font-bold text-brand">
              {q.label.trim() || `Pergunta ${step + 1}`}
            </h3>

            {q.type === "choice" ? (
              <div className="mt-5 space-y-2">
                {q.options
                  .filter((o) => o.trim())
                  .map((opt, i) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setAnswers((a) => ({ ...a, [q.id]: opt }));
                          next();
                        }}
                        className={`flex w-full items-center justify-between rounded-[5px] border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? "border-accent bg-accent/10 text-brand"
                            : "border-ink-soft/20 text-ink hover:border-accent/60 hover:bg-accent/5"
                        }`}
                      >
                        {opt}
                        <ArrowForward size={15} className="text-accent" />
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="mt-5">
                <textarea
                  aria-label={q.label || "Resposta"}
                  className="min-h-[110px] w-full resize-y rounded-[5px] border border-ink-soft/20 px-4 py-3 text-sm text-ink outline-none transition focus:border-accent"
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                  }
                  placeholder="Sua resposta"
                />
              </div>
            )}

            {q.type === "text" ? (
              <button
                type="button"
                onClick={next}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[5px] bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Avançar <ArrowForward size={16} />
              </button>
            ) : null}
          </div>
        )}

        {demo ? (
          <p className="mt-4 bg-amber-50 px-3 py-2 text-center text-[0.7rem] font-medium text-amber-700">
            Demonstração — os contatos só são capturados de verdade quando a
            página estiver publicada.
          </p>
        ) : null}
      </div>
    </div>
  );
}
