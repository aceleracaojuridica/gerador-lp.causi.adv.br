import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TEMPLATES } from "@/lib/landing-pages/templates";
import { TemplateMaterialCard } from "./template-material-card";
import "./templates-gallery.css";

export const metadata: Metadata = {
  title: "Templates de Landing Pages | Causi",
  description:
    "Escolha o template ideal para o site do seu escritório de advocacia. Designs estratégicos para converter mais clientes.",
};

const SITE_BG =
  "https://bonafide.digital/materiais/wp-content/uploads/2022/10/site-bg-1600x600.jpg";

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <title>Instagram</title>
      <path d="M14.829 6.302c-.738-.034-.96-.04-2.829-.04s-2.09.007-2.828.04c-1.899.087-2.783.986-2.87 2.87-.033.738-.041.959-.041 2.828s.008 2.09.041 2.829c.087 1.879.967 2.783 2.87 2.87.737.033.959.041 2.828.041 1.87 0 2.091-.007 2.829-.041 1.899-.086 2.782-.988 2.87-2.87.033-.738.04-.96.04-2.829s-.007-2.09-.04-2.828c-.088-1.883-.973-2.783-2.87-2.87zm-2.829 9.293c-1.985 0-3.595-1.609-3.595-3.595 0-1.985 1.61-3.594 3.595-3.594s3.595 1.609 3.595 3.594c0 1.985-1.61 3.595-3.595 3.595zm3.737-6.491c-.464 0-.84-.376-.84-.84 0-.464.376-.84.84-.84.464 0 .84.376.84.84 0 .463-.376.84-.84.84zm-1.404 2.896c0 1.289-1.045 2.333-2.333 2.333s-2.333-1.044-2.333-2.333c0-1.289 1.045-2.333 2.333-2.333s2.333 1.044 2.333 2.333zm-2.333-12c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.958 14.886c-.115 2.545-1.532 3.955-4.071 4.072-.747.034-.986.042-2.887.042s-2.139-.008-2.886-.042c-2.544-.117-3.955-1.529-4.072-4.072-.034-.746-.042-.985-.042-2.886 0-1.901.008-2.139.042-2.886.117-2.544 1.529-3.955 4.072-4.071.747-.035.985-.043 2.886-.043s2.14.008 2.887.043c2.545.117 3.957 1.532 4.071 4.071.034.747.042.985.042 2.886 0 1.901-.008 2.14-.042 2.886z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <title>YouTube</title>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0-2.276-.156-2.541-1.27-2.558-4.892.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0 2.277.156 2.541 1.27 2.559 4.892-.018 3.629-.285 4.736-2.559 4.892zm-6.441-7.234 4.917 2.338-4.917 2.346V9.658z" />
    </svg>
  );
}

export default function TemplatesGalleryPage() {
  return (
    <div className="templates-gallery">
      <div
        className="site-bg"
        style={{ backgroundImage: `url('${SITE_BG}')` }}
        aria-hidden
      />

      <header id="header">
        <div className="wrapper">
          <div className="header-shell">
            <Button asChild variant="outline-light" size="sm">
              <Link href="/">Voltar ao app</Link>
            </Button>

            <div className="header-logo">
              <Link href="/templates">
                <Image
                  src="/causi-logo-light.svg"
                  alt="Causi"
                  width={250}
                  height={72}
                  priority
                />
              </Link>
            </div>

            <span className="header-chip">Galeria pública</span>
          </div>
        </div>
      </header>

      <main className="gallery-main">
        <section className="material-block margin-lg">
          <div className="wrapper">
            <div className="section-header">
              <p className="hero-eyebrow">Templates de Landing Pages</p>
              <h1 className="section-title">
                Templates de Landing Pages para sua advocacia
              </h1>
              <p className="hero-subtitle">
                Escolha um modelo, visualize em tempo real e encontre o estilo
                ideal para o seu escritório.
              </p>
            </div>

            <div className="material-list">
              {TEMPLATES.map((template) => (
                <TemplateMaterialCard
                  key={template.id}
                  id={template.id}
                  name={template.name}
                  description={template.description}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="wrapper">
            <div className="footer-wrap">
              <div className="footer-logo">
                <Link href="/templates">
                  <Image
                    src="/causi-logo-light.svg"
                    alt="Causi"
                    width={180}
                    height={54}
                  />
                </Link>
              </div>

              <div className="footer-content">
                <p className="footer-text">
                  Gerador de landing pages para advogados brasileiros. CRM
                  Kanban, WhatsApp Inbox e follow-up automático.
                </p>
              </div>

              <div className="footer-social social-links">
                <ul>
                  <li>
                    <a
                      href="https://www.instagram.com/causi.com.br/"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      aria-label="Instagram Causi"
                    >
                      <InstagramIcon />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.youtube.com/@causi.com.br"
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      aria-label="YouTube Causi"
                    >
                      <YouTubeIcon />
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-final">
          <div className="wrapper footer-final-wrap">
            <div className="footer-info">
              Causi® — Todos os direitos reservados
            </div>
            <div className="footer-link">
              <Link href="/">Acessar o gerador</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
