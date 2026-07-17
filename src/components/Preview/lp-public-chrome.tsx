"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { FloatingWhatsAppButton } from "@/components/Sections/floating-whatsapp-button";
import {
  type LeadCaptureContext,
  LeadPopup,
} from "@/components/Sections/lead-popup";
import { PolicyPage } from "@/components/Sections/policy-page";
import { CtaConfigContext } from "@/components/ui/cta-config";
import { bodyFontVar, headingFontVar } from "@/lib/landing-pages/fonts";
import { whatsappLandingPath } from "@/lib/landing-pages/lp-url";
import type { LpSchema } from "@/lib/landing-pages/schema";
import { themeToCssVars } from "@/lib/landing-pages/schema";
import { LpPrivacyOpenContext } from "./lp-privacy-context";

/**
 * Chrome client da LP pública: tema CSS, CTA, popup de lead e política.
 * As seções entram como `children` (RSC).
 */
export function LpPublicChrome({
  schema,
  leadContext,
  turnstileSiteKey,
  children,
}: {
  schema: LpSchema;
  leadContext: LeadCaptureContext;
  turnstileSiteKey?: string;
  children: ReactNode;
}) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const headingVar = headingFontVar(schema.office.fonts?.heading);
  const bodyVar = bodyFontVar(schema.office.fonts?.body);
  const fontStyle: Record<string, string> = {
    fontFamily: "var(--font-body), system-ui, -apple-system, sans-serif",
  };
  if (headingVar) fontStyle["--font-display"] = headingVar;
  if (bodyVar) fontStyle["--font-body"] = bodyVar;
  if (schema.office.cardRadius !== "rounded") {
    fontStyle["--radius"] = "3px";
    fontStyle["--lp-corner"] = "5px";
    fontStyle["--lp-corner-sm"] = "5px";
  }

  const btn = schema.office.buttons;
  const action = btn?.action ?? "popup";
  const ctaHref =
    action === "link"
      ? (btn?.link ?? "").trim() || undefined
      : action === "whatsapp" && schema.office.whatsapp
        ? whatsappLandingPath(schema.office.whatsapp)
        : undefined;
  const ctaConfig = {
    href: ctaHref,
    square: btn?.radius !== "rounded",
    onCtaClick: action === "popup" ? () => setPopupOpen(true) : undefined,
  };

  return (
    <CtaConfigContext.Provider value={ctaConfig}>
      <LpPrivacyOpenContext.Provider value={() => setShowPolicy(true)}>
        <div
          style={{ ...themeToCssVars(schema.theme), ...fontStyle }}
          className="lp-root bg-white text-lp-ink"
        >
          {showPolicy ? (
            <PolicyPage
              office={schema.office}
              onBack={() => setShowPolicy(false)}
            />
          ) : (
            <>
              <main>{children}</main>
              <FloatingWhatsAppButton
                office={schema.office}
                onOpenPopup={() => setPopupOpen(true)}
              />
              <LeadPopup
                demo={false}
                open={popupOpen}
                onClose={() => setPopupOpen(false)}
                questions={schema.office.buttons?.popup?.questions ?? []}
                leadContext={leadContext}
                turnstileSiteKey={turnstileSiteKey}
                whatsapp={schema.office.whatsapp}
              />
            </>
          )}
        </div>
      </LpPrivacyOpenContext.Provider>
    </CtaConfigContext.Provider>
  );
}
