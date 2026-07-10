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
    optimizePackageImports: [
      "@material-symbols-svg/react",
      "@material-symbols-svg/react/outlined",
      "@material-symbols-svg/react/rounded",
      "@material-symbols-svg/react/sharp",
    ],
  }
};

export default nextConfig;
