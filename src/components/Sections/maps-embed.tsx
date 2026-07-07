import { Reveal } from "@/components/ui/reveal";

export function MapsEmbed({ src }: { src: string }) {
  if (!src || !src.trim()) return null;

  return (
    <section className="relative w-full bg-lp-cream py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-2xl text-center mb-8">
          <p className="eyebrow mb-3 text-lp-accent">Localização</p>
          <h2 className="section-title text-lp-brand">Como nos encontrar</h2>
        </div>
        <Reveal>
          <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl shadow-lg border border-border">
            <iframe
              src={src}
              title="Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
