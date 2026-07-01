import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
  },
  allowedDevOrigins: ["192.168.100.*", "192.168.15.*"],
};

export default nextConfig;
