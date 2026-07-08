"use client";

import { ArrowBack } from "@material-symbols-svg/react/rounded";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import { LandingPreview } from "@/components/Preview/landing-preview";
import { Button } from "@/components/ui/button";
import { buildSchema } from "@/lib/landing-pages/focos";
import type { Office } from "@/lib/landing-pages/schema";
import { TEMPLATES } from "@/lib/landing-pages/templates";

const MOCK_OFFICE: Office = {
  name: "Causi Advocacia",
  fullName: "Causi Advocacia & Associados",
  product: "Direito de Família",
  area: "Direito de Família e Sucessões",
  city: "São Paulo - SP",
  whatsapp: "11999999999",
  whatsappDisplay: "(11) 99999-9999",
  email: "contato@causi.adv.br",
  address: "Av. Paulista, 1000 - Bela Vista\nSão Paulo - SP, 01310-100",
  mapsUrl: "https://maps.google.com",
  about:
    "Nosso escritório é especializado em Direito de Família e Sucessões, atuando com sensibilidade, discrição e excelência técnica para proteger seus interesses e de quem você ama.",
  diferenciais: [
    "Atendimento personalizado e humanizado",
    "Foco em soluções estratégicas e pacíficas",
    "Alta especialização técnica e sigilo absoluto",
  ],
  logoSrc: "",
  logoBg: { type: "transparent", color: "#FFFFFF" },
  lawyers: [
    {
      photo: "",
      name: "Dr. Roberto Silva",
      role: "Sócio-Diretor",
    },
  ],
  socials: [],
  sectionImages: { hero: "", dor: "", sobre: "", solucao: "" },
  metrics: [],
  cardRadius: "rounded",
  buttons: {
    radius: "rounded",
    action: "whatsapp",
    link: "",
  },
};

type Props = {
  params: Promise<{ id: string }>;
};

export default function TemplatePreviewPage({ params }: Props) {
  const { id } = React.use(params);
  const template = TEMPLATES.find((t) => t.id === id);

  if (!template) {
    notFound();
  }

  const schema = React.useMemo(() => {
    return buildSchema(
      MOCK_OFFICE,
      template.theme,
      "Direito de Família", // Tema dummy para a LP
      template.layout,
    );
  }, [template]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Floating preview banner */}
      <div className="sticky top-0 z-50 border-b border-slate-700/80 bg-slate-900/85 px-4 py-3 text-slate-100 shadow-lg backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/templates">
              <Button
                variant="outline-light"
                size="sm"
                className="text-slate-200"
              >
                <ArrowBack className="mr-2 w-5 h-5 fill-current" />
                Voltar à Galeria
              </Button>
            </Link>
            <div className="hidden sm:block border-l border-slate-700 h-6" />
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400">
                Visualizando template:
              </span>
              <h2 className="text-sm font-bold text-white">{template.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-slate-600/80 bg-slate-800/70 px-3 py-1 text-xs text-slate-300">
              Modo de Visualização
            </span>
          </div>
        </div>
      </div>

      {/* Main landing preview container */}
      <div className="flex-1 bg-white">
        <LandingPreview schema={schema} demo={true} />
      </div>
    </div>
  );
}
