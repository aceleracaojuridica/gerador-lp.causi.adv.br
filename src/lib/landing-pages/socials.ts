import type { SocialNetwork } from "./schema";

/** Redes suportadas, na ordem de exibição (rodapé) e de edição (form). */
export const SOCIALS_META: {
  id: SocialNetwork;
  label: string;
  placeholder: string;
}[] = [
  {
    id: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/seu_perfil",
  },
  {
    id: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/sua_pagina",
  },
  {
    id: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@seu_canal",
  },
  {
    id: "tiktok",
    label: "TikTok",
    placeholder: "https://tiktok.com/@seu_perfil",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/voce",
  },
];

/**
 * Detecta a rede social a partir da URL, para escolher o ícone automaticamente.
 * Sem match reconhecido, assume Instagram (rede mais comum).
 */
export function detectNetwork(url: string): SocialNetwork {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("linkedin.com")) return "linkedin";
  if (u.includes("facebook.com") || u.includes("fb.com") || u.includes("fb.me"))
    return "facebook";
  return "instagram";
}
