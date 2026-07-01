"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildAuthCallbackUrl,
  getAuthErrorMessage,
  getSafeRedirectPath,
} from "@/lib/auth/auth";
import { showAuthEmailToast } from "@/lib/auth/auth-toast";
import { createClient } from "@/lib/supabase/client";

type AuthEmailResendKind = "signup" | "recovery";

interface UseAuthEmailResendOptions {
  kind: AuthEmailResendKind;
  email?: string;
  nextPath: string;
  fallbackNextPath?: string;
  cooldownSeconds?: number;
  missingEmailMessage: string;
  successMessage: string;
}

export function useAuthEmailResend({
  kind,
  email,
  nextPath,
  fallbackNextPath = "/dashboard",
  cooldownSeconds = 60,
  missingEmailMessage,
  successMessage,
}: UseAuthEmailResendOptions) {
  const supabase = createClient();
  const [isSending, setIsSending] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const safeNextPath = useMemo(
    () => getSafeRedirectPath(nextPath, fallbackNextPath),
    [fallbackNextPath, nextPath],
  );

  useEffect(() => {
    if (!cooldownUntil) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 500);

    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  const cooldownRemainingSeconds = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
    : 0;

  useEffect(() => {
    if (!cooldownUntil) return;
    if (cooldownRemainingSeconds > 0) return;
    setCooldownUntil(null);
  }, [cooldownRemainingSeconds, cooldownUntil]);

  const canResend = !isSending && cooldownRemainingSeconds === 0;

  const resend = useCallback(async () => {
    if (!email) {
      toast.error(missingEmailMessage);
      return;
    }

    if (!canResend) {
      return;
    }

    setIsSending(true);
    try {
      const signupRedirectTo = buildAuthCallbackUrl(
        `/confirmar?next=${encodeURIComponent(safeNextPath)}`,
      );

      const { error } =
        kind === "signup"
          ? await supabase.auth.resend({
              type: "signup",
              email,
              options: {
                emailRedirectTo: signupRedirectTo,
              },
            })
          : await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: buildAuthCallbackUrl(safeNextPath),
            });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      setCooldownUntil(Date.now() + cooldownSeconds * 1000);
      showAuthEmailToast(
        email,
        successMessage,
        kind === "signup"
          ? "Use o link enviado para confirmar seu e-mail e ativar o acesso."
          : "Use o link enviado para redefinir sua senha.",
      );

      const url = new URL(window.location.href);
      url.searchParams.set("type", "resend");
      window.history.replaceState(null, "", url.toString());
    } finally {
      setIsSending(false);
    }
  }, [
    canResend,
    cooldownSeconds,
    email,
    kind,
    missingEmailMessage,
    safeNextPath,
    successMessage,
    supabase,
  ]);

  return {
    resend,
    canResend,
    isSending,
    cooldownRemainingSeconds,
    safeNextPath,
  };
}
