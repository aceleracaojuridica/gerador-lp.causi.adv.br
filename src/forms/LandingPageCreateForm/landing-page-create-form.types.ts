import type { SocialNetwork } from "@/lib/landing-pages/schema";

export type SavedAddress = {
  id: string;
  address: string;
  cidade: string;
  uf: string;
  maps_url: string | null;
  is_primary: boolean;
};

export type SavedContact = {
  id: string;
  whatsapp: string;
  whatsapp_display: string;
  email: string;
  is_primary: boolean;
};

export type SavedSocial = {
  id: string;
  network: SocialNetwork;
  url: string;
  is_primary: boolean;
};

export type LandingPageCreateFormProps = {
  defaultOfficeName?: string;
  savedAddresses?: SavedAddress[];
  savedContacts?: SavedContact[];
  savedSocials?: SavedSocial[];
};
