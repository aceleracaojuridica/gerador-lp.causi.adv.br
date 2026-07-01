import { buildSchema } from "./focos";
import { imagensDoTema } from "./image-bank";
import type { LpSchema, Office } from "./schema";
import { getTemplate, TEMPLATES } from "./templates";

const PORTRAIT =
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80";

const DEMO_OFFICE: Office = {
  name: "Silva & Associados",
  fullName: "Silva & Associados Advocacia",
  product: "Direito Civil",
  area: "Direito Civil e Contratos",
  city: "São Paulo/SP",
  whatsapp: "5511999999999",
  whatsappDisplay: "(11) 99999-9999",
  email: "contato@exemplo.com.br",
  address: "Av. Paulista, 1000 — Bela Vista\nSão Paulo — SP",
  mapsUrl: "",
  about:
    "Escritório de advocacia com atuação dedicada em causas cíveis e contratuais. Atendimento próximo e orientação clara em cada etapa do processo.",
  logoSrc: "",
  logoBg: { type: "dark", color: "#1e293b" },
  lawyers: [
    { name: "Ana Silva", role: "Sócia · OAB/SP 123.456", photo: PORTRAIT },
    { name: "Carlos Mendes", role: "Sócio · OAB/SP 654.321", photo: PORTRAIT },
  ],
  socials: [{ network: "instagram", url: "https://instagram.com/" }],
  sectionImages: imagensDoTema(""),
  metrics: [],
  diferenciais: ["Atendimento personalizado", "Transparência em cada etapa"],
  buttons: {
    radius: "rounded",
    action: "popup",
    link: "",
    popup: { questions: [] },
  },
};

/** Schema de demonstração para pré-visualizar um template (copy genérica). */
export function buildTemplatePreviewSchema(
  templateId: string,
): LpSchema | null {
  if (!TEMPLATES.some((t) => t.id === templateId)) return null;
  const template = getTemplate(templateId);
  return buildSchema(
    { ...DEMO_OFFICE, sectionImages: imagensDoTema("") },
    template.theme,
    "",
    template.layout,
  );
}
