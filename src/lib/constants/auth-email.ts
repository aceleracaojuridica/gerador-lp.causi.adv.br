export const AUTH_EMAIL_FALLBACK = {
  label: "Abrir e-mail",
  url: "https://mail.google.com",
} as const;

export const AUTH_EMAIL_PROVIDERS = [
  {
    label: "Abrir Gmail",
    url: "https://mail.google.com/mail/u/0/?hl=pt-BR#advanced-search/from=aviso%40causi.com.br&has=Causi",
    domainIncludes: ["gmail"],
  },
  {
    label: "Abrir Outlook",
    url: "https://outlook.live.com",
    domainRegex: /hotm|outl|live|msn/,
  },
  {
    label: "Abrir Yahoo",
    url: "https://mail.yahoo.com",
    domainIncludes: ["yahoo"],
  },
  {
    label: "Abrir iCloud",
    url: "https://www.icloud.com/mail",
    domainIncludes: ["icloud"],
  },
] as const;
