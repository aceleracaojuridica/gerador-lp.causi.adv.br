import { SocialIcon } from "@/components/icons/social-icon";
import type { Office } from "@/lib/landing-pages/schema";
import { waLink } from "@/lib/landing-pages/schema";
import { SOCIALS_META } from "@/lib/landing-pages/socials";

export function Footer({
  office,
  onPrivacyClick,
}: {
  office: Office;
  onPrivacyClick?: () => void;
}) {
  const socials = office.socials.filter((s) => s.url.trim());
  const year = new Date().getFullYear();
  const nome = office.fullName || office.name || "Seu Escritório";

  // Endereços agrupados por cidade.
  // Mesma cidade → empilha na mesma coluna. Cidades diferentes → coluna por cidade.
  const allAddresses = [
    { address: office.address, city: office.city, mapsUrl: office.mapsUrl },
    ...(office.extraAddresses ?? []),
  ].filter((a) => a.address?.trim() || a.city?.trim());

  const addressGroups = (() => {
    if (allAddresses.length === 0)
      return [] as { city: string; items: typeof allAddresses }[];
    const map = new Map<string, typeof allAddresses>();
    for (const a of allAddresses) {
      const key = (a.city || "").trim();
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(a);
    }
    return Array.from(map.entries()).map(([city, items]) => ({ city, items }));
  })();

  const multiCity = addressGroups.length > 1;
  // Formato de exibição "Cidade/UF" → "Cidade – UF" (compatível com IBGE)
  function fmtCity(c: string) {
    return c.replace("/", " – ");
  }

  // Contatos: principal + adicionais (só os preenchidos). Ficam numa coluna;
  // a partir de 3, quebram em colunas de 2 (cada chunk vira uma coluna).
  const contacts = [
    {
      whatsapp: office.whatsapp,
      whatsappDisplay: office.whatsappDisplay,
      email: office.email,
    },
    ...(office.extraContacts ?? []),
  ].filter((c) => c.whatsappDisplay?.trim() || c.email?.trim());
  const contactColumns: (typeof contacts)[] = [];
  for (let i = 0; i < contacts.length; i += 2) {
    contactColumns.push(contacts.slice(i, i + 2));
  }

  return (
    <footer className="bg-lp-brand-dark text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-10 md:flex md:flex-row md:gap-10">
          {/* Endereços — coluna única (1 cidade) ou coluna por cidade (multi) */}
          {multiCity ? (
            addressGroups.map((g, gi) => (
              <div key={gi} className="min-w-0 md:flex-1">
                <p className="mb-1 text-base font-bold text-white">
                  {fmtCity(g.city)}
                </p>
                <div className="mb-4 h-px w-8 bg-lp-accent-soft" />
                <div className="space-y-4">
                  {g.items.map((a, i) => (
                    <div key={i}>
                      <p className="whitespace-pre-line leading-relaxed text-white/75">
                        {a.address?.trim() || a.city}
                      </p>
                      {a.mapsUrl ? (
                        <a
                          href={a.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-lp-accent-soft transition hover:text-white"
                        >
                          Ver no mapa <span aria-hidden>↗</span>
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="min-w-0 md:flex-1">
              <p className="eyebrow mb-4 text-lp-accent-soft">
                {allAddresses.length > 1 ? "Endereços" : "Endereço"}
              </p>
              {allAddresses.length > 0 ? (
                <div className="space-y-4">
                  {allAddresses.map((a, i) => (
                    <div key={i}>
                      <p className="whitespace-pre-line leading-relaxed text-white/75">
                        {a.address?.trim() || a.city}
                      </p>
                      {a.mapsUrl ? (
                        <a
                          href={a.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-lp-accent-soft underline-offset-2 transition hover:text-white hover:underline"
                        >
                          Ver mais <span aria-hidden>→</span>
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/75">Atendimento Online</p>
              )}
            </div>
          )}

          {/* Contato(s) — 1 coluna; a partir de 3, quebra em colunas de 2 */}
          {contactColumns.map((col, ci) => (
            <div key={ci} className="min-w-0 md:flex-1">
              <p className="eyebrow mb-4 text-lp-accent-soft">Contato</p>
              <div className="space-y-3 text-white/75">
                {col.map((c, i) => (
                  <div key={i} className="space-y-1.5">
                    {c.whatsappDisplay ? (
                      <p>
                        <a
                          href={waLink(
                            c.whatsapp,
                            "Olá, vim pelo site e gostaria de tirar uma dúvida.",
                          )}
                          className="transition hover:text-lp-accent-soft"
                        >
                          {c.whatsappDisplay}
                        </a>
                      </p>
                    ) : null}
                    {c.email ? (
                      <p>
                        <a
                          href={`mailto:${c.email}`}
                          className="break-all transition hover:text-lp-accent-soft"
                        >
                          {c.email}
                        </a>
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Redes sociais */}
          {socials.length > 0 ? (
            <div className="min-w-0 md:flex-1 md:text-right">
              <p className="eyebrow mb-4 text-lp-accent-soft">Acompanhe</p>
              <div className="flex gap-3 md:justify-end">
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      SOCIALS_META.find((m) => m.id === s.network)?.label ??
                      s.network
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lp-accent-soft transition hover:border-white/30 hover:bg-white/15 hover:text-white"
                  >
                    <SocialIcon network={s.network} size={18} />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Barra inferior */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
            {/* Tela separada. No preview do builder, onPrivacyClick mostra a
                página em tela cheia; na LP publicada vira o link
                /[slug]/politica-de-privacidade (o deploy gera a página). */}
            {onPrivacyClick ? (
              <button
                type="button"
                onClick={onPrivacyClick}
                className="text-white/70 underline-offset-2 transition hover:text-white hover:underline"
              >
                Política de Privacidade
              </button>
            ) : (
              <a
                href="politica-de-privacidade"
                className="text-white/70 underline-offset-2 transition hover:text-white hover:underline"
              >
                Política de Privacidade
              </a>
            )}
            <span className="text-white/60">
              © {year} {nome}. Todos os direitos reservados.
            </span>
          </div>
          <p className="mt-4 text-center text-xs text-white/40">
            Criado por{" "}
            <a
              href="https://www.causi.com.br/advogado"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lp-accent-soft underline-offset-2 transition hover:text-white hover:underline"
            >
              Causi
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
