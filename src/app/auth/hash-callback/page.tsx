"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getSafeRedirectPath } from "@/lib/auth/auth";

function parseHashTokens(hash: string) {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  );

  return {
    accessToken: params.get("access_token") ?? "",
    refreshToken: params.get("refresh_token") ?? "",
  };
}

type ConsumeResponse = {
  redirectTo?: unknown;
  message?: unknown;
};

export default function AuthHashCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const nextPath = getSafeRedirectPath(
      url.searchParams.get("next"),
      "/dashboard",
    );

    const hasServerConsumableParams =
      url.searchParams.has("code") || url.searchParams.has("token_hash");

    if (hasServerConsumableParams) {
      window.location.replace(`/auth/callback${url.search}`);
      return;
    }

    const { accessToken, refreshToken } = parseHashTokens(window.location.hash);

    if (!accessToken || !refreshToken) {
      window.location.replace(`/auth/callback${url.search}`);
      return;
    }

    const consume = async () => {
      const res = await fetch("/auth/callback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
          next: nextPath,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as ConsumeResponse;

      if (!res.ok) {
        const message =
          typeof data.message === "string"
            ? data.message
            : "Não foi possível concluir a autenticação.";
        setError(message);
        return;
      }

      const redirectTo =
        typeof data.redirectTo === "string" ? data.redirectTo : "/dashboard";
      window.location.replace(getSafeRedirectPath(redirectTo, "/dashboard"));
    };

    consume().catch(() => {
      setError("Não foi possível concluir a autenticação.");
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      {error ? (
        <div className="w-full max-w-sm rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Processando autenticação...
        </div>
      )}
    </div>
  );
}
