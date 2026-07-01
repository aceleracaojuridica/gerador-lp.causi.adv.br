export interface SessionUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

export interface SessionAccount {
  id: number;
  name: string;
  status: string | null;
}

export interface SessionRole {
  id: number;
  slug: string;
  accessLevel: number;
  permissions: Record<string, string[]>;
}

export interface SessionUsage {
  agents_count: number | null;
  channels_count: number | null;
  deals_count: number | null;
  persons_count: number | null;
  pipelines_count: number | null;
  users_count: number | null;
}

export interface SessionLimits {
  max_contacts: number | null;
  max_users: number | null;
  max_channels: number | null;
  max_pipelines: number | null;
  [key: string]: number | null;
}

export type SessionFeatures = Record<string, boolean>;

export type SessionPlan = {
  id: number | null;
  name: string | null;
  slug: string | null;
  tierLevel: number | null;
  status: string | null;
};

export interface SessionSubscription {
  status: "active" | "trial" | null;
  [key: string]: unknown;
}

export interface Session {
  user: SessionUser;
  account: SessionAccount;
  role: SessionRole;
  /** Plano da assinatura ativa (billing.plans). `null` sem assinatura ativa. */
  plan: SessionPlan | null;
  subscription: SessionSubscription;
  usage: SessionUsage;
  limits: SessionLimits;
  features: SessionFeatures;
  hasSharedAccounts: boolean;
}

export type SessionUpdater = (prev: Session) => Session;
