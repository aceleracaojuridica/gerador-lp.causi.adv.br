"use client";

import {
  Check,
  Code,
  ProgressActivity,
  Settings,
} from "@material-symbols-svg/react";
import { useEffect, useState } from "react";
import { getConfigAction, saveConfigAction } from "@/app/actions/config";
import { useLpAccess } from "@/components/lp-access-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAccessDeniedError } from "@/lib/errors";
import type { GlobalConfig } from "@/lib/landing-pages/config";
import { BODY_FONTS, HEADING_FONTS } from "@/lib/landing-pages/fonts";
import { showAccessDeniedToast } from "@/lib/toast";
import { Field, inputCls } from "./fields";

const EMPTY: GlobalConfig = {
  fonts: { heading: "", body: "" },
  tags: { head: "", body: "", footer: "" },
  domain: "",
};

const codeCls = `${inputCls} min-h-[90px] resize-y font-mono text-xs leading-relaxed`;

export function GlobalSettings({
  open: controlledOpen,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
} = {}) {
  const hasLpAccess = useLpAccess();
  const controlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? controlledOpen : internalOpen;
  const setOpen = controlled
    ? (v: boolean) => {
        if (!v) onClose?.();
      }
    : setInternalOpen;

  const [cfg, setCfg] = useState<GlobalConfig>(EMPTY);
  const [state, setState] = useState<"idle" | "loading" | "saving" | "saved">(
    "idle",
  );

  useEffect(() => {
    if (!open) return;
    setState("loading");
    getConfigAction()
      .then((c: GlobalConfig) => {
        setCfg({ ...EMPTY, ...c });
        setState("idle");
      })
      .catch(() => setState("idle"));
  }, [open]);

  async function salvar() {
    setState("saving");
    try {
      const res = await saveConfigAction(cfg);
      if ("error" in res) {
        if (isAccessDeniedError(res.error)) {
          showAccessDeniedToast();
        }
        setState("idle");
        return;
      }
      setState("saved");
      setTimeout(() => setState("idle"), 1500);
    } catch {
      setState("idle");
    }
  }

  return (
    <>
      {!controlled ? (
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => {
            if (!hasLpAccess) {
              showAccessDeniedToast();
              return;
            }
            setOpen(true);
          }}
        >
          <Settings size={16} /> Configurações
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[88vh] max-w-lg flex-col gap-0 p-0">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle>Configurações globais</DialogTitle>
            <p className="text-xs text-muted-foreground">
              Valem para todas as suas páginas
            </p>
          </DialogHeader>

          <DialogBody className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {state === "loading" ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ProgressActivity size={15} className="animate-spin" />{" "}
                Carregando…
              </p>
            ) : null}

            <section className="space-y-2">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Tipografia
              </p>
              <p className="text-xs text-muted-foreground">
                Deixe em &quot;Padrão do site&quot; para usar Fraunces nos
                títulos e Inter no texto.
              </p>
              <Field label="Títulos">
                <Select
                  value={cfg.fonts.heading || "__default"}
                  onValueChange={(v) =>
                    setCfg((c) => ({
                      ...c,
                      fonts: {
                        ...c.fonts,
                        heading: v === "__default" ? "" : v,
                      },
                    }))
                  }
                >
                  <SelectTrigger
                    aria-label="Fonte dos títulos"
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default">
                      Padrão do site (Fraunces)
                    </SelectItem>
                    {HEADING_FONTS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Texto">
                <Select
                  value={cfg.fonts.body || "__default"}
                  onValueChange={(v) =>
                    setCfg((c) => ({
                      ...c,
                      fonts: { ...c.fonts, body: v === "__default" ? "" : v },
                    }))
                  }
                >
                  <SelectTrigger aria-label="Fonte do texto" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__default">
                      Padrão do site (Inter)
                    </SelectItem>
                    {BODY_FONTS.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </section>

            <Accordion
              type="single"
              collapsible
              className="border-t border-border pt-4"
            >
              <AccordionItem value="avancado" className="border-b-0">
                <AccordionTrigger className="py-0 hover:no-underline [&>svg]:mt-0">
                  <span className="flex flex-1 items-center gap-2.5 text-left">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Code size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        Avançado (técnico)
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Tags de conversão e domínio próprio
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mt-3 space-y-5 rounded-lg border border-border bg-muted/40 p-3.5">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Preencha só se você usa Google Tag Manager, Pixel/gtag ou
                      um domínio próprio. Em branco, nada é alterado.
                    </p>

                    <div className="space-y-2">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        Acompanhar resultados (códigos de campanha)
                      </p>
                      <Field
                        label="Head"
                        hint="Scripts no <head> (GTM, gtag, verificação)."
                      >
                        <textarea
                          aria-label="Tags no head"
                          className={codeCls}
                          value={cfg.tags.head}
                          onChange={(e) =>
                            setCfg((c) => ({
                              ...c,
                              tags: { ...c.tags, head: e.target.value },
                            }))
                          }
                          placeholder="<!-- código para o <head> -->"
                          spellCheck={false}
                        />
                      </Field>
                      <Field
                        label="Body"
                        hint="Após abrir o <body> (ex.: <noscript> do GTM)."
                      >
                        <textarea
                          aria-label="Tags no body"
                          className={codeCls}
                          value={cfg.tags.body}
                          onChange={(e) =>
                            setCfg((c) => ({
                              ...c,
                              tags: { ...c.tags, body: e.target.value },
                            }))
                          }
                          placeholder="<!-- código para o início do <body> -->"
                          spellCheck={false}
                        />
                      </Field>
                      <Field
                        label="Rodapé"
                        hint="No fim da página, antes de fechar o </body>."
                      >
                        <textarea
                          aria-label="Tags no rodapé"
                          className={codeCls}
                          value={cfg.tags.footer}
                          onChange={(e) =>
                            setCfg((c) => ({
                              ...c,
                              tags: { ...c.tags, footer: e.target.value },
                            }))
                          }
                          placeholder="<!-- código para o fim da página -->"
                          spellCheck={false}
                        />
                      </Field>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                        Domínio
                      </p>
                      <Field
                        label="Endereço próprio do site (ex.: seuescritorio.com.br)"
                        hint="A conexão é finalizada na publicação."
                      >
                        <input
                          className={inputCls}
                          value={cfg.domain}
                          onChange={(e) =>
                            setCfg((c) => ({ ...c, domain: e.target.value }))
                          }
                          placeholder="meuescritorio.com.br"
                          inputMode="url"
                        />
                      </Field>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </DialogBody>

          <DialogFooter className="border-t border-border px-5 py-3">
            <Button
              type="button"
              onClick={salvar}
              disabled={state === "saving"}
              className="w-full"
            >
              {state === "saving" ? (
                <ProgressActivity size={15} className="animate-spin" />
              ) : state === "saved" ? (
                <Check size={15} />
              ) : null}
              {state === "saving"
                ? "Salvando"
                : state === "saved"
                  ? "Salvo"
                  : "Salvar"}
            </Button>
            <DialogClose className="sr-only" />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
