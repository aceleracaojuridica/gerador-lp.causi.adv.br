"use client";

import { Add, Close } from "@material-symbols-svg/react";
import { AutoTextarea } from "@/components/auto-textarea";
import { BuilderField } from "@/components/Builder/shared/fields";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import {
  AREAS_CTA_FALLBACK,
  CTA_PRIMARY,
  CTA_SECONDARY,
  GENERIC_ETAPAS,
} from "@/lib/landing-pages/focos";

function EyebrowField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <BuilderField
      label="Linha de cima (menor)"
      hint="Texto curto acima do título."
    >
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex: Como ajudamos"
      />
    </BuilderField>
  );
}

function HeadlineFields({
  headline,
  onPart,
}: {
  headline: { pre: string; em: string; post: string };
  onPart: (part: "pre" | "em" | "post", v: string) => void;
}) {
  return (
    <BuilderField
      label="Título principal"
      hint="O trecho do meio aparece na cor da marca (destaque)."
    >
      <div className="flex flex-col gap-1.5">
        <Input
          value={headline.pre}
          onChange={(e) => onPart("pre", e.target.value)}
          placeholder="Início da frase"
        />
        <Input
          value={headline.em}
          onChange={(e) => onPart("em", e.target.value)}
          placeholder="Trecho em destaque (cor da marca)"
        />
        <Input
          value={headline.post}
          onChange={(e) => onPart("post", e.target.value)}
          placeholder="Final (opcional)"
        />
      </div>
    </BuilderField>
  );
}

// Lista de pares (título + texto) — usada por cards, etapas e perguntas.
function PairList({
  title,
  items,
  phA,
  phB,
  multilineB = true,
  onChange,
  onAdd,
  onRemove,
  addLabel = "Adicionar",
  minItems = 0,
}: {
  title: string;
  items: { a: string; b: string }[];
  phA: string;
  phB: string;
  multilineB?: boolean;
  onChange: (i: number, which: "a" | "b", v: string) => void;
  onAdd?: () => void;
  onRemove?: (i: number) => void;
  addLabel?: string;
  minItems?: number;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
        {title}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-slate-200 p-2.5"
          >
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  {phA} {i + 1}
                </span>
                {onRemove && items.length > minItems ? (
                  <button
                    type="button"
                    aria-label="Remover"
                    onClick={() => onRemove(i)}
                    className="flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Close size={14} />
                  </button>
                ) : null}
              </div>
              <Input
                value={it.a}
                onChange={(e) => onChange(i, "a", e.target.value)}
                placeholder={phA}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-slate-600">{phB}</p>
              {multilineB ? (
                <AutoTextarea
                  className="min-h-[56px] resize-y"
                  value={it.b}
                  onChange={(e) => onChange(i, "b", e.target.value)}
                  placeholder={phB}
                />
              ) : (
                <Input
                  value={it.b}
                  onChange={(e) => onChange(i, "b", e.target.value)}
                  placeholder={phB}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      {onAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-ui/40 px-4 py-2.5 text-sm font-medium text-ui transition hover:border-ui hover:bg-ui-soft/50"
        >
          <Add size={16} /> {addLabel}
        </button>
      ) : null}
    </div>
  );
}

export function HeroTexts({ form }: { form: LpEditorForm }) {
  const h = form.copy.hero;
  return (
    <>
      <EyebrowField
        value={h.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.hero.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={h.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.hero.headline[p] = v;
          })
        }
      />
      <BuilderField label="Subtítulo" hint="Frase abaixo do título principal.">
        <AutoTextarea
          className="min-h-[70px] resize-y"
          value={h.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.hero.sub = e.target.value;
            })
          }
          placeholder="Uma ou duas frases que falam com o cliente."
        />
      </BuilderField>
      <div className="grid grid-cols-2 gap-2">
        <BuilderField label="Botão principal">
          <Input
            aria-label="Texto do botão principal"
            value={h.ctaPrimary ?? CTA_PRIMARY}
            onChange={(e) =>
              form.editCopy((c) => {
                c.hero.ctaPrimary = e.target.value;
              })
            }
          />
        </BuilderField>
        <BuilderField label="Botão secundário">
          <Input
            aria-label="Texto do botão secundário"
            value={h.ctaSecondary ?? CTA_SECONDARY}
            onChange={(e) =>
              form.editCopy((c) => {
                c.hero.ctaSecondary = e.target.value;
              })
            }
          />
        </BuilderField>
      </div>
    </>
  );
}

export function DorTexts({ form }: { form: LpEditorForm }) {
  const d = form.copy.dor;
  return (
    <>
      <EyebrowField
        value={d.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.dor.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={d.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.dor.headline[p] = v;
          })
        }
      />
      <BuilderField label="Introdução" hint="Parágrafo de abertura da seção.">
        <AutoTextarea
          aria-label="Introdução"
          className="min-h-[70px] resize-y"
          value={d.intro}
          onChange={(e) =>
            form.editCopy((c) => {
              c.dor.intro = e.target.value;
            })
          }
        />
      </BuilderField>
    </>
  );
}

export function DorCards({ form }: { form: LpEditorForm }) {
  const d = form.copy.dor;
  return (
    <PairList
      title=""
      items={d.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Título do problema"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.dor.cards[i].title = v;
          else c.dor.cards[i].text = v;
        })
      }
    />
  );
}

export function SolucaoTexts({ form }: { form: LpEditorForm }) {
  const s = form.copy.solucao;
  return (
    <>
      <EyebrowField
        value={s.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.solucao.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={s.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.solucao.headline[p] = v;
          })
        }
      />
      <BuilderField label="Subtítulo">
        <AutoTextarea
          className="min-h-[60px] resize-y"
          aria-label="Subtítulo"
          value={s.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.solucao.sub = e.target.value;
            })
          }
        />
      </BuilderField>
    </>
  );
}

export function SolucaoCards({ form }: { form: LpEditorForm }) {
  const s = form.copy.solucao;
  return (
    <PairList
      title=""
      items={s.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Título"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.solucao.cards[i].title = v;
          else c.solucao.cards[i].text = v;
        })
      }
    />
  );
}

export function AreasTexts({ form }: { form: LpEditorForm }) {
  const a = form.copy.areas;
  return (
    <>
      <EyebrowField
        value={a.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.areas.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={a.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.areas.headline[p] = v;
          })
        }
      />
      <BuilderField label="Subtítulo">
        <AutoTextarea
          className="min-h-[60px] resize-y"
          aria-label="Subtítulo"
          value={a.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.areas.sub = e.target.value;
            })
          }
        />
      </BuilderField>
      <BuilderField label="Texto do botão da seção">
        <Input
          aria-label="Texto do botão da seção"
          value={a.cta ?? AREAS_CTA_FALLBACK}
          onChange={(e) =>
            form.editCopy((c) => {
              c.areas.cta = e.target.value;
            })
          }
        />
      </BuilderField>
    </>
  );
}

export function AreasCards({ form }: { form: LpEditorForm }) {
  const a = form.copy.areas;
  return (
    <PairList
      title=""
      items={a.cards.map((c) => ({ a: c.title, b: c.text }))}
      phA="Nome da área"
      phB="Descrição"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.areas.cards[i].title = v;
          else c.areas.cards[i].text = v;
        })
      }
    />
  );
}

export function EtapasTexts({ form }: { form: LpEditorForm }) {
  const e = form.copy.etapas ?? GENERIC_ETAPAS;
  return (
    <>
      <EyebrowField
        value={e.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
            c.etapas.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={e.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
            c.etapas.headline[p] = v;
          })
        }
      />
    </>
  );
}

export function EtapasCards({ form }: { form: LpEditorForm }) {
  const e = form.copy.etapas ?? GENERIC_ETAPAS;
  return (
    <PairList
      title=""
      items={e.steps.map((s) => ({ a: s.title, b: s.text }))}
      phA="Nome do passo"
      phB="O que acontece"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          c.etapas = c.etapas ?? structuredClone(GENERIC_ETAPAS);
          if (w === "a") c.etapas.steps[i].title = v;
          else c.etapas.steps[i].text = v;
        })
      }
    />
  );
}

export function FaqTexts({ form }: { form: LpEditorForm }) {
  const f = form.copy.faq;
  return (
    <>
      <EyebrowField
        value={f.eyebrow}
        onChange={(v) =>
          form.editCopy((c) => {
            c.faq.eyebrow = v;
          })
        }
      />
      <HeadlineFields
        headline={f.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.faq.headline[p] = v;
          })
        }
      />
    </>
  );
}

export function FaqPerguntas({ form }: { form: LpEditorForm }) {
  const f = form.copy.faq;
  return (
    <PairList
      title=""
      items={f.items.map((it) => ({ a: it.q, b: it.a }))}
      phA="Pergunta"
      phB="Resposta"
      onChange={(i, w, v) =>
        form.editCopy((c) => {
          if (w === "a") c.faq.items[i].q = v;
          else c.faq.items[i].a = v;
        })
      }
      onAdd={() =>
        form.editCopy((c) => {
          c.faq.items.push({ q: "", a: "" });
        })
      }
      onRemove={(i) =>
        form.editCopy((c) => {
          c.faq.items.splice(i, 1);
        })
      }
      addLabel="Adicionar pergunta"
      minItems={3}
    />
  );
}

export function CtaFinalTexts({ form }: { form: LpEditorForm }) {
  const cf = form.copy.ctaFinal;
  return (
    <>
      <HeadlineFields
        headline={cf.headline}
        onPart={(p, v) =>
          form.editCopy((c) => {
            c.ctaFinal.headline[p] = v;
          })
        }
      />
      <BuilderField label="Subtítulo">
        <AutoTextarea
          className="min-h-[60px] resize-y"
          aria-label="Subtítulo"
          value={cf.sub}
          onChange={(e) =>
            form.editCopy((c) => {
              c.ctaFinal.sub = e.target.value;
            })
          }
        />
      </BuilderField>
      <BuilderField label="Texto do botão">
        <Input
          aria-label="Texto do botão"
          value={cf.cta}
          onChange={(e) =>
            form.editCopy((c) => {
              c.ctaFinal.cta = e.target.value;
            })
          }
        />
      </BuilderField>
    </>
  );
}
