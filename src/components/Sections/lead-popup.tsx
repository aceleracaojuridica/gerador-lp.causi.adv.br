"use client";

import {
  ArrowBack,
  ArrowForward,
  Check,
  Close,
} from "@material-symbols-svg/react";
import { useEffect, useState } from "react";
import { submitLeadAction } from "@/app/actions/leads";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { validatePopupAnswer } from "@/lib/landing-pages/popup/validation";
import type { PopupQuestion } from "@/lib/landing-pages/schema";
import { PopupQuestionField } from "./popup-question-field";

const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";

export type LeadCaptureContext = {
  officeSubdomain: string;
  lpSlug: string;
};

/**
 * Popup de lead. Mostra as perguntas personalizadas (uma por vez) e, no final,
 * sempre o passo simples com nome + telefone. No preview é ilustrativo; na LP
 * publicada envia via submitLeadAction.
 */
export function LeadPopup({
  open,
  onClose,
  questions,
  demo = false,
  leadContext,
}: {
  open: boolean;
  onClose: () => void;
  questions: PopupQuestion[];
  demo?: boolean;
  leadContext?: LeadCaptureContext;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [lead, setLead] = useState({ nome: "", telefone: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
      setLead({ nome: "", telefone: "" });
      setSent(false);
      setSubmitting(false);
      setSubmitError(null);
      setStepError(null);
      setCaptchaToken("");
    }
  }, [open]);

  if (!open) return null;

  const total = questions.length + 1;
  const isFinal = step >= questions.length;
  const q = questions[step];

  async function handleSubmit() {
    if (demo) {
      setSent(true);
      return;
    }
    if (!leadContext) {
      setSubmitError("Não foi possível enviar o contato.");
      return;
    }
    const nome = lead.nome.trim();
    const telefone = lead.telefone.trim();
    if (!nome || !telefone) {
      setSubmitError("Preencha nome e telefone.");
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setSubmitError("Confirme o captcha antes de enviar.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    const res = await submitLeadAction({
      officeSubdomain: leadContext.officeSubdomain,
      lpSlug: leadContext.lpSlug,
      nome,
      telefone,
      answers,
      pageUrl: typeof window !== "undefined" ? window.location.href : "",
      captchaToken: captchaToken || undefined,
    });
    setSubmitting(false);

    if (!res.ok) {
      setSubmitError(res.error);
      return;
    }
    setSent(true);
  }

  function next() {
    setStep((s) => Math.min(total - 1, s + 1));
    setStepError(null);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
    setStepError(null);
  }

  function tryAdvanceQuestion() {
    if (!q) return;
    const value = answers[q.id] ?? "";
    const err = validatePopupAnswer(q, value);
    if (err) {
      setStepError(err);
      return;
    }
    next();
  }

  const needsAdvanceButton =
    q &&
    (q.type === "text" ||
      q.type === "number" ||
      q.type === "phone" ||
      q.type === "email" ||
      q.type === "url" ||
      q.type === "currency" ||
      q.type === "cep" ||
      (q.type === "choice" && q.allowMultiple));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-[5px] bg-white p-7 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          {step > 0 && !sent ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1 rounded-[5px] px-2 py-1 text-xs font-semibold text-lp-ink-soft transition hover:bg-black/5 hover:text-lp-brand"
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
            className="rounded-full p-1 text-lp-ink-soft transition hover:bg-black/5"
          >
            <Close size={18} />
          </button>
        </div>

        {!sent ? (
          <div className="mb-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-lp-cream-deep">
              <div
                className="h-full rounded-full bg-lp-accent transition-all"
                style={{ width: `${((step + 1) / total) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-lp-ink-soft">
              Etapa {step + 1} de {total}
            </p>
          </div>
        ) : null}

        {sent ? (
          <div className="py-6 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-lp-accent/15 text-lp-accent">
              <Check size={28} />
            </span>
            <h3 className="font-display text-xl font-bold text-lp-brand">
              Recebemos seu contato!
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-lp-ink-soft">
              Em breve entraremos em contato. Obrigado!
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-[5px] bg-lp-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-lp-brand-dark"
            >
              Fechar
            </button>
          </div>
        ) : isFinal ? (
          <div>
            <h3 className="font-display text-xl font-bold text-lp-brand">
              Quase lá! Deixe seu contato
            </h3>
            <p className="mt-1 text-sm text-lp-ink-soft">
              Preencha para falarmos com você.
            </p>
            <div className="mt-5 space-y-3">
              <input
                aria-label="Nome"
                className="w-full rounded-[5px] border border-lp-ink-soft/20 px-4 py-3 text-sm text-lp-ink outline-none transition focus:border-lp-accent"
                value={lead.nome}
                onChange={(e) =>
                  setLead((l) => ({ ...l, nome: e.target.value }))
                }
                placeholder="Seu nome"
                required
              />
              <input
                aria-label="Telefone"
                className="w-full rounded-[5px] border border-lp-ink-soft/20 px-4 py-3 text-sm text-lp-ink outline-none transition focus:border-lp-accent"
                value={lead.telefone}
                onChange={(e) =>
                  setLead((l) => ({ ...l, telefone: e.target.value }))
                }
                placeholder="(00) 00000-0000"
                inputMode="tel"
                required
              />
            </div>
            {TURNSTILE_SITE_KEY && !demo ? (
              <div className="mt-4">
                <TurnstileWidget
                  siteKey={TURNSTILE_SITE_KEY}
                  onToken={setCaptchaToken}
                  onExpire={() => setCaptchaToken("")}
                />
              </div>
            ) : null}
            {submitError ? (
              <p className="mt-3 text-center text-sm text-destructive">
                {submitError}
              </p>
            ) : null}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[5px] bg-lp-accent px-5 py-3 text-sm font-bold text-[var(--color-lp-accent-ink)] transition hover:bg-lp-accent-soft disabled:opacity-60"
            >
              {submitting ? "Enviando…" : "Enviar"}
            </button>
          </div>
        ) : q ? (
          <div>
            <h3 className="font-display text-xl font-bold text-lp-brand">
              {q.label.trim() || `Pergunta ${step + 1}`}
            </h3>

            <div className="mt-5">
              <PopupQuestionField
                question={q}
                value={answers[q.id] ?? ""}
                onChange={(v) => {
                  setAnswers((a) => ({ ...a, [q.id]: v }));
                  setStepError(null);
                }}
                error={stepError}
                onChoiceSelect={
                  q.type === "choice" && !q.allowMultiple
                    ? () => next()
                    : undefined
                }
              />
            </div>

            {stepError && q.type !== "cep" ? (
              <p className="mt-3 text-center text-sm text-destructive">
                {stepError}
              </p>
            ) : null}

            {needsAdvanceButton ? (
              <button
                type="button"
                onClick={tryAdvanceQuestion}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[5px] bg-lp-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-lp-brand-dark"
              >
                Avançar <ArrowForward size={16} />
              </button>
            ) : null}
          </div>
        ) : null}

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
