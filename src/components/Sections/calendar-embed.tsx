"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { Reveal } from "@/components/ui/reveal";

type CalendarEmbedProps = {
  src: string;
  mode: "iframe" | "button";
};

export function CalendarEmbed({ src, mode }: CalendarEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!src || !src.trim()) return null;

  if (mode === "button") {
    return (
      <div className="flex flex-col items-center justify-center my-6">
        <link
          href="https://calendar.google.com/calendar/scheduling-button-script.css"
          rel="stylesheet"
        />
        <Script
          src="https://calendar.google.com/calendar/scheduling-button-script.js"
          strategy="lazyOnload"
          onLoad={() => {
            if (
              typeof window !== "undefined" &&
              (window as any).calendar?.schedulingButton
            ) {
              const target = containerRef.current;
              if (target) {
                target.innerHTML = ""; // Clear duplicate initializations
                (window as any).calendar.schedulingButton.load({
                  url: src,
                  color: "#039BE5",
                  label: "Agendar um compromisso",
                  target,
                });
              }
            }
          }}
        />
        <div
          ref={containerRef}
          className="calendar-button-target min-h-[45px]"
        />
      </div>
    );
  }

  return (
    <section className="relative w-full bg-lp-cream py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <p className="eyebrow mb-3 text-lp-accent">Agendamento</p>
          <h2 className="section-title text-lp-brand">Reserve seu Horário</h2>
        </div>
        <Reveal>
          <div className="relative w-full h-[600px] overflow-hidden rounded-2xl shadow-lg border border-border bg-white">
            <iframe
              src={src}
              title="Google Calendar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
