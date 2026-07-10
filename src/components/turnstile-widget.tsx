"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

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

/** Widget Cloudflare Turnstile para formulários públicos. */
export function TurnstileWidget({
  siteKey,
  onToken,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container || !window.turnstile || widgetIdRef.current) return;

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      callback: onToken,
      "expired-callback": onExpire,
      theme: "auto",
    });
  }, [siteKey, onToken, onExpire]);

  useEffect(() => {
    if (ready) renderWidget();
  }, [ready, renderWidget]);

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
