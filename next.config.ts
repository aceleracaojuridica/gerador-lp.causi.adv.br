import type { NextConfig } from "next";

function supabaseImageHost(): string | null {
  const base = process.env.LP_SUPABASE_URL?.trim();
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
    ],
  },
  experimental: {
    // As imagens (galeria, logo, retratos) sobem como data URL base64 no corpo
    // da Server Action, e o base64 infla o arquivo em ~33%. Com o padrão de 1 MB
    // do Next, um upload de ~750 KB já estourava com "Body exceeded 1 MB limit".
    // O app anuncia 10 MB como tamanho máximo → 10 MB em base64 ≈ 13,5 MB.
    serverActions: {
      bodySizeLimit: "15mb",
    },
    optimizePackageImports: [
      "@material-symbols-svg/react",
      "@material-symbols-svg/react/outlined",
      "@material-symbols-svg/react/rounded",
      "@material-symbols-svg/react/sharp",
    ],
  },
};

export default nextConfig;
