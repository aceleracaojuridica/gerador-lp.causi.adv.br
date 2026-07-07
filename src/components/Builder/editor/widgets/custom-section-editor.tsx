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
import { Input } from "@/components/ui/input";
import type { LpEditorForm } from "@/forms/LpEditorForm";
import type { CustomSection } from "@/lib/landing-pages/schema";
import { extractYouTubeId } from "@/lib/landing-pages/youtube";
import { BuilderField } from "../../shared/fields";
import { Accordion, Segmented, ToneToggle } from "../controls/editor-controls";

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
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-ui-hover"
      >
        <Add size={16} /> Adicionar seção
      </button>
    );
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-2 text-xs font-medium text-slate-600">
        Que tipo de seção você quer?
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            onAdd("cards");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <GridView size={20} className="text-slate-500" />
          Com cards
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("texto");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <Notes size={20} className="text-slate-500" />
          Com texto
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("youtube");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <Movie size={20} className="text-slate-500" />
          Vídeo YouTube
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("calendar");
            setChoosing(false);
          }}
          className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <CalendarMonth size={20} className="text-slate-500" />
          Agendamento
        </button>
        <button
          type="button"
          onClick={() => {
            onAdd("maps");
            setChoosing(false);
          }}
          className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-ui-hover"
        >
          <HomePin size={20} className="text-slate-500" />
          Mapa Google Maps
        </button>
      </div>
    </div>
  );
}

export function CustomSectionEditor({
  form,
  section,
  onScroll,
}: {
  form: LpEditorForm;
  section: CustomSection;
  onScroll: () => void;
}) {
  const titulo = section.title.trim() || "Nova seção";
  const tipo = section.kind;
  return (
    <Accordion
      title={titulo}
      domId={`acc-custom-${section.id}`}
      onOpen={onScroll}
      target={`sec-custom-${section.id}`}
      icon={
        tipo === "cards" ? (
          <Dashboard size={22} />
        ) : tipo === "youtube" ? (
          <Movie size={22} />
        ) : tipo === "calendar" ? (
          <CalendarMonth size={22} />
        ) : tipo === "maps" ? (
          <HomePin size={22} />
        ) : (
          <Notes size={22} />
        )
      }
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
        <BuilderField
          label="Link do vídeo do YouTube"
          hint="Cole o link completo do vídeo ou o ID de 11 caracteres."
        >
          <Input
            value={section.youtubeId ?? ""}
            onChange={(e) => {
              const val = e.target.value;
              const extracted = extractYouTubeId(val);
              form.setCustomField(section.id, "youtubeId", extracted || val);
            }}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </BuilderField>
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
                key={`card_${i}_${c.title.toLowerCase().replaceAll(" ", "_").trim()}`}
                className="space-y-2 rounded-lg border border-slate-200 p-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    Card {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Remover card"
                    onClick={() => form.removeCustomCard(section.id, i)}
                    className="rounded-lg px-1.5 text-slate-400 transition hover:bg-ui-hover hover:text-slate-700"
                  >
                    <Close size={14} />
                  </button>
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
          <button
            type="button"
            onClick={() => form.addCustomCard(section.id)}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-ui-hover hover:text-slate-800"
          >
            <Add size={13} /> Adicionar card
          </button>
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

      <ToneToggle
        value={section.tone}
        onChange={(t) => form.setCustomTone(section.id, t)}
      />

      <button
        type="button"
        onClick={() => form.removeCustomSection(section.id)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
      >
        <Delete size={14} /> Excluir seção
      </button>
    </Accordion>
  );
}
