"use client";

import Script from "next/script";
import { useEffect, useEffectEvent, useRef } from "react";

type TurnstileWidgetProps = {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

/**
 * Widget Cloudflare Turnstile (render explícito).
 * Não usa turnstile.ready(): next/script carrega api.js com async/defer, e a
 * Cloudflare exige script síncrono para ready(). Com onLoad / window.turnstile
 * já presente, render() é seguro.
 */
export function TurnstileWidget({
  siteKey,
  onToken,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const onTokenEvent = useEffectEvent((token: string) => {
    onToken(token);
  });
  const onExpireEvent = useEffectEvent(() => {
    onExpire?.();
  });

  const mountWidget = useEffectEvent(() => {
    const container = containerRef.current;
    if (!container || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: (token) => onTokenEvent(token),
      "expired-callback": () => onExpireEvent(),
      theme: "auto",
    });
  });

  // Remonta quando siteKey muda; mountWidget é useEffectEvent (identity estável).
  // biome-ignore lint/correctness/useExhaustiveDependencies: siteKey força remount; mountWidget é EffectEvent
  useEffect(() => {
    // Script já no documento (reabrir popup): onLoad do next/script não refira.
    if (window.turnstile) {
      mountWidget();
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => mountWidget()}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
