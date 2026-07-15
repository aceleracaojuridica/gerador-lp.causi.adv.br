"use client";

import {
  Add,
  CalendarMonth,
  Close,
  Dashboard,
  Delete,
  GridView,
  HomePin,
  Movie,
  Notes,
} from "@material-symbols-svg/react";
import { useState } from "react";
import { AutoTextarea } from "@/components/auto-textarea";
import {
  CUSTOM_CARDS_MAX,
  CUSTOM_CARDS_MIN,
} from "@/components/Sections/custom-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { CustomSection } from "@/lib/landing-pages/schema";
import { extractYouTubeId } from "@/lib/landing-pages/youtube";
import { BuilderField } from "../../shared/fields";
import { Accordion, Segmented, ToneToggle } from "../controls/editor-controls";
import { useStableListKeys } from "../use-stable-list-keys";

export function AddSectionButton({
  onAdd,
}: {
  onAdd: (kind: CustomSection["kind"]) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  if (!choosing) {
    return (
      <button
        type="button"
        onClick={() => setChoosing(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
      >
        <Add size={16} /> Adicionar seção
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <p className="mb-2 text-xs font-medium text-foreground">
        Que tipo de seção você quer?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onAdd("cards");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-xs font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
        >
          <GridView size={20} className="text-muted-foreground" />
          Com cards
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("texto");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-xs font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
        >
          <Notes size={20} className="text-muted-foreground" />
          Com texto
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("youtube");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-xs font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
        >
          <Movie size={20} className="text-muted-foreground" />
          Vídeo YouTube
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("calendar");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3 text-xs font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
        >
          <CalendarMonth size={20} className="text-muted-foreground" />
          Agendamento
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("maps");
            setChoosing(false);
          }}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 py-2.5 text-xs font-medium text-foreground transition hover:border-muted-foreground/50 hover:bg-ui-hover"
        >
          <HomePin size={20} className="text-muted-foreground" />
          Mapa Google Maps
        </button>
      </div>
    </div>
  );
}

/** Ícone da seção personalizada por tipo — reusado na lista e no cabeçalho. */
export function customSectionIcon(kind: CustomSection["kind"], size = 22) {
  switch (kind) {
    case "cards":
      return <Dashboard size={size} />;
    case "youtube":
      return <Movie size={size} />;
    case "calendar":
      return <CalendarMonth size={size} />;
    case "maps":
      return <HomePin size={size} />;
    default:
      return <Notes size={size} />;
  }
}

export function CustomSectionEditor({
  form,
  section,
  onScroll,
  bare,
}: {
  form: LpEditorForm;
  section: CustomSection;
  onScroll: () => void;
  /** No painel de detalhe: só os campos, sem o cabeçalho/borda do accordion. */
  bare?: boolean;
}) {
  const titulo = section.title.trim() || "Nova seção";
  const tipo = section.kind;
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Espelha o render: em "Preenchido" a seção é só a mídia, sem título/texto/botão.
  const isFullWidth =
    section.variant === "fullWidth" &&
    (tipo === "youtube" || tipo === "calendar" || tipo === "maps");
  // Key estável por posição: derivar do texto digitado remontava o card a cada
  // tecla e derrubava o foco (só dava para digitar um caractere por vez).
  const cardKeys = useStableListKeys(
    section.cards,
    (c) => `${c.title} ${c.text}`,
    "custom-card",
  );
  return (
    <Accordion
      bare={bare}
      title={titulo}
      domId={`acc-custom-${section.id}`}
      onOpen={onScroll}
      target={`sec-custom-${section.id}`}
      icon={customSectionIcon(tipo)}
      subtitle={`Seção personalizada · ${
        tipo === "cards"
          ? "com cards"
          : tipo === "youtube"
            ? "vídeo do YouTube"
            : tipo === "calendar"
              ? "Agendamento Google Calendar"
              : tipo === "maps"
                ? "Mapa Google Maps"
                : "com texto"
      }`}
    >
      <ToneToggle
        value={section.tone}
        onChange={(t) => form.setCustomTone(section.id, t)}
      />

      <BuilderField label="Título de cima (opcional)">
        <Input
          value={section.eyebrow}
          onChange={(e) =>
            form.setCustomField(section.id, "eyebrow", e.target.value)
          }
          placeholder="Ex: Nosso diferencial"
        />
      </BuilderField>
      <BuilderField label="Título">
        <Input
          value={section.title}
          onChange={(e) =>
            form.setCustomField(section.id, "title", e.target.value)
          }
          placeholder="Título da seção"
        />
      </BuilderField>

      {section.kind === "texto" ? (
        <BuilderField
          label="Texto"
          hint="Pule linha para separar em parágrafos."
        >
          <AutoTextarea
            aria-label="Texto da seção"
            className="min-h-[120px] resize-y"
            value={section.text}
            onChange={(e) =>
              form.setCustomField(section.id, "text", e.target.value)
            }
            placeholder="Escreva o conteúdo desta seção..."
          />
        </BuilderField>
      ) : section.kind === "youtube" ? (
        <>
          <BuilderField
            label="Link do vídeo do YouTube"
            hint="Cole o link completo do vídeo ou o ID de 11 caracteres."
          >
            <Input
              value={section.youtubeId ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val.trim()) {
                  form.setCustomField(section.id, "youtubeId", "");
                  return;
                }
                form.setCustomField(
                  section.id,
                  "youtubeId",
                  extractYouTubeId(val) || val,
                );
              }}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </BuilderField>
          <BuilderField
            label="Texto (opcional)"
            hint="Aparece entre o título e o vídeo. Pule linha para separar em parágrafos."
          >
            <AutoTextarea
              aria-label="Texto da seção de vídeo"
              className="min-h-[90px] resize-y"
              value={section.text}
              onChange={(e) =>
                form.setCustomField(section.id, "text", e.target.value)
              }
              placeholder="Escreva um apoio para o vídeo..."
            />
          </BuilderField>
        </>
      ) : section.kind === "calendar" ? (
        <BuilderField
          label="Link de incorporação do Google Calendar"
          hint="Abra o Google Calendar → Configurar agendamento → Incorporar → copie o código HTML ou só o link src do iframe."
        >
          <Input
            value={section.calendarUrl ?? ""}
            onChange={(e) => {
              form.setCustomField(section.id, "calendarUrl", e.target.value);
            }}
            placeholder="https://calendar.google.com/calendar/embed?src=..."
          />
        </BuilderField>
      ) : section.kind === "maps" ? (
        <BuilderField
          label="Link de incorporação do Google Maps"
          hint="Abra o Google Maps → Compartilhar → Incorporar mapa → copie o código HTML ou só o link src do iframe."
        >
          <Input
            value={section.mapsUrl ?? ""}
            onChange={(e) => {
              form.setCustomField(section.id, "mapsUrl", e.target.value);
            }}
            placeholder="<iframe src='https://www.google.com/maps/embed...'></iframe>"
          />
        </BuilderField>
      ) : (
        <div>
          <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ui-gray">
            Cards
          </p>
          <div className="space-y-2">
            {section.cards.map((c, i) => (
              <div
                key={cardKeys[i]}
                className="space-y-2 rounded-lg border border-border p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Card {i + 1}
                  </span>
                  {section.cards.length > CUSTOM_CARDS_MIN ? (
                    <button
                      type="button"
                      aria-label="Remover card"
                      onClick={() => form.removeCustomCard(section.id, i)}
                      className="rounded-lg px-1.5 text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
                    >
                      <Close size={14} />
                    </button>
                  ) : null}
                </div>
                <Input
                  aria-label={`Título do card ${i + 1}`}
                  value={c.title}
                  onChange={(e) =>
                    form.setCustomCardField(
                      section.id,
                      i,
                      "title",
                      e.target.value,
                    )
                  }
                  placeholder="Título do card"
                />
                <AutoTextarea
                  aria-label={`Texto do card ${i + 1}`}
                  className="min-h-[56px] resize-y"
                  value={c.text}
                  onChange={(e) =>
                    form.setCustomCardField(
                      section.id,
                      i,
                      "text",
                      e.target.value,
                    )
                  }
                  placeholder="Descrição do card"
                />
              </div>
            ))}
          </div>
          {section.cards.length < CUSTOM_CARDS_MAX ? (
            <button
              type="button"
              onClick={() => form.addCustomCard(section.id)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-ui-hover hover:text-foreground"
            >
              <Add size={13} /> Adicionar card ({section.cards.length}/
              {CUSTOM_CARDS_MAX})
            </button>
          ) : (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Máximo de {CUSTOM_CARDS_MAX} cards atingido.
            </p>
          )}
        </div>
      )}

      {(section.kind === "youtube" ||
        section.kind === "calendar" ||
        section.kind === "maps") && (
        <div className="mb-4">
          <Segmented
            label="Layout da seção"
            value={section.variant ?? "boxed"}
            onChange={(v) => form.setCustomField(section.id, "variant", v)}
            options={[
              { id: "boxed", label: "Borda" },
              { id: "fullWidth", label: "Preenchido" },
            ]}
          />
        </div>
      )}

      {/* Botão da seção: vale para qualquer formato. No layout "Preenchido" a
          seção é só a mídia, então o botão não aparece — e o campo some junto. */}
      {isFullWidth ? null : (
        <BuilderField
          label="Botão (opcional)"
          hint="Deixe vazio para não mostrar o botão. Ele usa a mesma ação dos demais botões da página."
        >
          <Input
            value={section.cta ?? ""}
            onChange={(e) =>
              form.setCustomField(section.id, "cta", e.target.value)
            }
            placeholder="Ex: Falar com um advogado"
          />
        </BuilderField>
      )}

      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
      >
        <Delete size={14} /> Excluir seção
      </button>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir seção"
        description={`Remover "${titulo}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => form.removeCustomSection(section.id)}
      />
    </Accordion>
  );
}
