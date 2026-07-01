import type { SocialNetwork } from "@/lib/landing-pages/schema";

// Ícones de marca como SVG inline (logos de marca não existem no Material
// Symbols). Traçado para ig/fb/yt/in; preenchido para o tiktok. currentColor.
export function SocialIcon({
  network,
  size = 20,
  className,
}: {
  network: SocialNetwork;
  size?: number;
  className?: string;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className,
    "aria-hidden": true,
  } as const;

  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (network) {
    case "instagram":
      return (
        <svg {...common} {...stroke}>
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle
            cx="17.6"
            cy="6.4"
            r="1.1"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} {...stroke}>
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common} {...stroke}>
          <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
          <path d="m10 15 5-3-5-3z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common} {...stroke}>
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} fill="currentColor">
          <path d="M16.5 0h-3.3v15.6a2.7 2.7 0 1 1-2.1-2.64V9.6a6 6 0 1 0 5.4 5.97V8.1a7.4 7.4 0 0 0 4.3 1.38V6.15a4.1 4.1 0 0 1-4.3-4.07V0z" />
        </svg>
      );
  }
}
