"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/whatsapp-icon";

const REDIRECT_SECONDS = 5;

/**
 * Página intermediária: espera 5s (tempo para pixels/scripts de conversão
 * dispararem) e então redireciona para o WhatsApp do escritório.
 */
export function WhatsAppRedirect({ whatsapp }: { whatsapp: string }) {
  const target = whatsapp ? `https://wa.me/${whatsapp}` : "";
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!target) return;
    const redirect = setTimeout(() => {
      window.location.replace(target);
    }, REDIRECT_SECONDS * 1000);
    const tick = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      clearTimeout(redirect);
      clearInterval(tick);
    };
  }, [target]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0b141a] px-6 text-center text-white">
      <span className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-white shadow-lg">
        <WhatsAppIcon className="h-12 w-12" />
      </span>
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Abrindo o WhatsApp…</h1>
        <p className="text-sm text-white/70">
          {target
            ? `Você será redirecionado em ${seconds}s.`
            : "Número de WhatsApp não informado."}
        </p>
      </div>
      <span className="h-1 w-40 overflow-hidden rounded-full bg-white/15">
        <span
          className="block h-full rounded-full bg-[#25D366] transition-[width] duration-1000 ease-linear"
          style={{
            width: `${((REDIRECT_SECONDS - seconds) / REDIRECT_SECONDS) * 100}%`,
          }}
        />
      </span>
      {target ? (
        <a
          href={target}
          className="text-sm font-medium text-[#25D366] underline underline-offset-4"
        >
          Clique aqui se não for redirecionado
        </a>
      ) : null}
    </main>
  );
}
