import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
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
