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
