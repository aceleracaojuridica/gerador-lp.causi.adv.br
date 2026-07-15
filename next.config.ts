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
    optimizePackageImports: [
      "@material-symbols-svg/react",
      "@material-symbols-svg/react/outlined",
      "@material-symbols-svg/react/rounded",
      "@material-symbols-svg/react/sharp",
    ],
  },
};

export default nextConfig;
