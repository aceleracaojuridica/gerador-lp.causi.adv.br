type DealStatusKey = "open" | "won" | "lost";

type DealRow = {
  account_id: number;
  additional_info: unknown;
  blocked_at: string | null;
  blocked_reason: string | null;
  created_at: string;
  created_by_user_id: string | null;
  id: number;
  is_active: boolean;
  lost_reason: string | null;
  lost_time: string | null;
  name: string;
  order: number;
  origin: string;
  owner_user_id: string | null;
  person_id: number | null;
  pipeline_id: number;
  pipeline_stage_id: number;
  qualification_status: string;
  qualification_updated_at: string;
  qualification_updated_by: string | null;
  status: DealStatusKey;
  updated_at: string;
  updated_by: string | null;
  value: number | null;
  won_time: string | null;
};

type ConversationRow = {
  id: number;
  created_at: string;
  updated_at: string;
  status: string;
  channel_id: number;
  person_id: number | null;
  deal_id: number;
  account_id: number;
  created_by_user_id: string | null;
  last_message_at: string;
  reply_to: string | null;
  viewed_at: string | null;
  channel_phone: string | null;
  channel_type: string | null;
  follow_up_count: number;
  is_paused: boolean;
  intent: string | null;
  summary: string | null;
  agent_id: number | null;
  channel_identifier: string | null;
  contact_identifier: string | null;
};

type MessageRow = {
  id: number;
  created_at: string;
  updated_at: string;
  viewed_at: string | null;
  content: unknown;
  direction: string;
  reaction: unknown;
  type: string;
  sender_type: string;
  sender_id: string | null;
  replied_to_message_id: number | null;
  conversation_id: number;
  api_message_id: string;
};

type DashboardChartPoint = {
  label: string;
  value: number;
};

type DashboardOriginPoint = {
  origin: string;
  count: number;
  fill: string;
};

type DashboardStagePoint = {
  stage: string;
  value: number;
  fill: string;
};

/**
 * Mocks do dashboard modelados a partir das linhas reais das tabelas públicas.
 *
 * @remarks
 * Os arrays em `rows` seguem um formato próximo ao contrato do Supabase. As propriedades agregadas
 * (`distribution`, `charts`, `origins`, `stages`) são derivadas dessas linhas e
 * existem apenas para facilitar a renderização atual do dashboard.
 */
const ACCOUNT_ID = 1;
const PIPELINE_MAIN_ID = 35;
const PIPELINE_CAMPAIGN_ID = 36;
const PIPELINE_DEV_TEST_ID = 37;
const PIPELINE_CONTACTS_TEST_ID = 38;

const USER_OWNER_ID = "0c4a9a7f-8b22-4a08-aed7-6a80719e6f81";
const USER_ADMIN_ID = "92ac0e56-ecce-4d56-a1b7-7f62efef6d75";
const USER_MEMBER_ID = "6c92e5ab-6782-44f5-b36b-4b76e2eb26bc";

const MOCK_NOW = "2026-04-16T12:00:00.000Z";

const account = {
  id: ACCOUNT_ID,
  created_at: "2026-01-05T10:00:00.000Z",
  updated_at: MOCK_NOW,
  name: "Garcia & Kleeman",
  slug: "garcia-kleeman",
  status: "active",
  created_by_user_id: USER_OWNER_ID,
  currency: "brl",
  address: "Avenida Paulista",
  address_complement: "Conjunto 1204",
  address_number: "1000",
  city: "São Paulo",
  state: "SP",
  zip_code: "01310-100",
  cnpj: "12.345.678/0001-90",
  phone: "+5511999990000",
  asaas_customer_id: "cus_000001",
  has_used_trial: true,
  phone_details: {
    country_code: "55",
    area_code: "11",
    local_number: "999990000",
  },
  email: "financeiro@garciakleeman.com.br",
};

const users = [
  {
    id: USER_OWNER_ID,
    created_at: "2026-01-05T10:00:00.000Z",
    updated_at: MOCK_NOW,
    name: "Dra. Marina Garcia",
    slug: "marina-garcia",
    created_by_user_id: null,
    account_id: ACCOUNT_ID,
    photo: null,
    role_id: 100,
    email: "marina@garciakleeman.com.br",
    status: "active",
    last_sign_in_at: "2026-04-16T08:30:00.000Z",
  },
  {
    id: USER_ADMIN_ID,
    created_at: "2026-01-08T11:20:00.000Z",
    updated_at: MOCK_NOW,
    name: "Dr. Rafael Kleeman",
    slug: "rafael-kleeman",
    created_by_user_id: USER_OWNER_ID,
    account_id: ACCOUNT_ID,
    photo: null,
    role_id: 50,
    email: "rafael@garciakleeman.com.br",
    status: "active",
    last_sign_in_at: "2026-04-15T18:40:00.000Z",
  },
  {
    id: USER_MEMBER_ID,
    created_at: "2026-02-01T09:10:00.000Z",
    updated_at: MOCK_NOW,
    name: "Oliver Lins",
    slug: "oliver-lins",
    created_by_user_id: USER_OWNER_ID,
    account_id: ACCOUNT_ID,
    photo: null,
    role_id: 20,
    email: "oliver@garciakleeman.com.br",
    status: "active",
    last_sign_in_at: "2026-04-16T09:05:00.000Z",
  },
];

const pipelines = [
  {
    id: PIPELINE_MAIN_ID,
    created_at: "2026-01-05T10:05:00.000Z",
    updated_at: MOCK_NOW,
    name: "Principal",
    slug: "principal",
    created_by_user_id: USER_OWNER_ID,
    account_id: ACCOUNT_ID,
    owner_user_id: USER_OWNER_ID,
  },
  {
    id: PIPELINE_CAMPAIGN_ID,
    created_at: "2026-02-10T14:00:00.000Z",
    updated_at: MOCK_NOW,
    name: "Campanha",
    slug: "campanha",
    created_by_user_id: USER_ADMIN_ID,
    account_id: ACCOUNT_ID,
    owner_user_id: USER_ADMIN_ID,
  },
  {
    id: PIPELINE_DEV_TEST_ID,
    created_at: "2026-03-01T09:00:00.000Z",
    updated_at: MOCK_NOW,
    name: "Teste Dev",
    slug: "teste-dev",
    created_by_user_id: USER_ADMIN_ID,
    account_id: ACCOUNT_ID,
    owner_user_id: USER_ADMIN_ID,
  },
  {
    id: PIPELINE_CONTACTS_TEST_ID,
    created_at: "2026-03-05T09:00:00.000Z",
    updated_at: MOCK_NOW,
    name: "Teste Contatos",
    slug: "teste-contatos",
    created_by_user_id: USER_ADMIN_ID,
    account_id: ACCOUNT_ID,
    owner_user_id: USER_ADMIN_ID,
  },
];

const pipelineStages = [
  {
    id: 3501,
    created_at: "2026-01-05T10:10:00.000Z",
    updated_at: MOCK_NOW,
    name: "Novo",
    order: 1,
    pipeline_id: PIPELINE_MAIN_ID,
    color: "#7622e1",
    type: "initial",
  },
  {
    id: 3502,
    created_at: "2026-01-05T10:11:00.000Z",
    updated_at: MOCK_NOW,
    name: "Triagem",
    order: 2,
    pipeline_id: PIPELINE_MAIN_ID,
    color: "#8b5cf6",
    type: "middle",
  },
  {
    id: 3503,
    created_at: "2026-01-05T10:12:00.000Z",
    updated_at: MOCK_NOW,
    name: "Reunião",
    order: 3,
    pipeline_id: PIPELINE_MAIN_ID,
    color: "#06b6d4",
    type: "middle",
  },
  {
    id: 3504,
    created_at: "2026-01-05T10:13:00.000Z",
    updated_at: MOCK_NOW,
    name: "Proposta",
    order: 4,
    pipeline_id: PIPELINE_MAIN_ID,
    color: "#f59e0b",
    type: "middle",
  },
  {
    id: 3505,
    created_at: "2026-01-05T10:14:00.000Z",
    updated_at: MOCK_NOW,
    name: "Contrato",
    order: 5,
    pipeline_id: PIPELINE_MAIN_ID,
    color: "#22c55e",
    type: "final",
  },
  {
    id: 3601,
    created_at: "2026-02-10T14:05:00.000Z",
    updated_at: MOCK_NOW,
    name: "Entrada",
    order: 1,
    pipeline_id: PIPELINE_CAMPAIGN_ID,
    color: "#7622e1",
    type: "initial",
  },
  {
    id: 3701,
    created_at: "2026-03-01T09:05:00.000Z",
    updated_at: MOCK_NOW,
    name: "Teste",
    order: 1,
    pipeline_id: PIPELINE_DEV_TEST_ID,
    color: "#7622e1",
    type: "initial",
  },
];

const channels = [
  {
    id: 101,
    created_at: "2026-01-10T12:00:00.000Z",
    updated_at: MOCK_NOW,
    name: "WhatsApp Principal",
    type: "evolution",
    status: "connected",
    phone: "+5511999990000",
    created_by_user_id: USER_OWNER_ID,
    pipeline_id: PIPELINE_MAIN_ID,
    account_id: ACCOUNT_ID,
    config: {
      instance_name: "garcia-kleeman-principal",
      provider: "evolution",
    },
    connected_at: "2026-01-10T12:20:00.000Z",
    is_active: true,
    ignored_contacts: [],
    last_disconnected_at: null,
    last_disconnected_reason: null,
    identifier: "evo_garcia_kleeman_main",
  },
  {
    id: 102,
    created_at: "2026-02-10T14:20:00.000Z",
    updated_at: MOCK_NOW,
    name: "WhatsApp Campanha",
    type: "uazapi",
    status: "connected",
    phone: "+5511888880000",
    created_by_user_id: USER_ADMIN_ID,
    pipeline_id: PIPELINE_CAMPAIGN_ID,
    account_id: ACCOUNT_ID,
    config: {
      instance_name: "garcia-kleeman-campaign",
      provider: "uazapi",
    },
    connected_at: "2026-02-10T14:35:00.000Z",
    is_active: true,
    ignored_contacts: ["5511000000000"],
    last_disconnected_at: null,
    last_disconnected_reason: null,
    identifier: "uaz_garcia_kleeman_campaign",
  },
  {
    id: 103,
    created_at: "2026-03-01T09:20:00.000Z",
    updated_at: MOCK_NOW,
    name: "Instagram",
    type: "instagram",
    status: "disconnected",
    phone: null,
    created_by_user_id: USER_ADMIN_ID,
    pipeline_id: PIPELINE_DEV_TEST_ID,
    account_id: ACCOUNT_ID,
    config: {
      profile: "@garciakleeman.adv",
    },
    connected_at: null,
    is_active: false,
    ignored_contacts: null,
    last_disconnected_at: "2026-04-12T16:40:00.000Z",
    last_disconnected_reason: "token_expired",
    identifier: "ig_garcia_kleeman",
  },
];

function createDeal(
  overrides: Pick<
    DealRow,
    | "id"
    | "name"
    | "created_at"
    | "person_id"
    | "pipeline_id"
    | "pipeline_stage_id"
    | "status"
  > &
    Partial<DealRow>,
): DealRow {
  return {
    account_id: ACCOUNT_ID,
    additional_info: overrides.additional_info ?? null,
    blocked_at: overrides.blocked_at ?? null,
    blocked_reason: overrides.blocked_reason ?? null,
    created_at: overrides.created_at,
    created_by_user_id: overrides.created_by_user_id ?? USER_ADMIN_ID,
    id: overrides.id,
    is_active: overrides.is_active ?? true,
    lost_reason: overrides.lost_reason ?? null,
    lost_time: overrides.lost_time ?? null,
    name: overrides.name,
    order: overrides.order ?? overrides.id,
    origin: overrides.origin ?? "whatsapp",
    owner_user_id: overrides.owner_user_id ?? USER_MEMBER_ID,
    person_id: overrides.person_id,
    pipeline_id: overrides.pipeline_id,
    pipeline_stage_id: overrides.pipeline_stage_id,
    qualification_status: overrides.qualification_status ?? "qualified",
    qualification_updated_at:
      overrides.qualification_updated_at ?? overrides.created_at,
    qualification_updated_by:
      overrides.qualification_updated_by ?? USER_MEMBER_ID,
    status: overrides.status,
    updated_at: overrides.updated_at ?? overrides.created_at,
    updated_by: overrides.updated_by ?? USER_MEMBER_ID,
    value: overrides.value ?? null,
    won_time: overrides.won_time ?? null,
  };
}

const deals = [
  createDeal({
    id: 1001,
    name: "Inventário - Família Almeida",
    created_at: "2026-01-08T09:00:00.000Z",
    updated_at: "2026-01-22T16:20:00.000Z",
    person_id: 2001,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 7500,
    origin: "whatsapp",
    won_time: "2026-01-22T16:20:00.000Z",
  }),
  createDeal({
    id: 1002,
    name: "Ação Trabalhista - João Lima",
    created_at: "2026-01-13T10:30:00.000Z",
    updated_at: "2026-01-26T11:00:00.000Z",
    person_id: 2002,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 4200,
    origin: "instagram",
    won_time: "2026-01-26T11:00:00.000Z",
  }),
  createDeal({
    id: 1003,
    name: "Contratual - Clínica Norte",
    created_at: "2026-02-02T12:10:00.000Z",
    updated_at: "2026-02-14T15:10:00.000Z",
    person_id: 2003,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 5800,
    origin: "facebook",
    won_time: "2026-02-14T15:10:00.000Z",
  }),
  createDeal({
    id: 1004,
    name: "Consultoria LGPD - Escola Horizonte",
    created_at: "2026-02-08T13:25:00.000Z",
    updated_at: "2026-02-19T10:45:00.000Z",
    person_id: 2004,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 9200,
    origin: "referral",
    won_time: "2026-02-19T10:45:00.000Z",
  }),
  createDeal({
    id: 1005,
    name: "Família - Guarda Compartilhada",
    created_at: "2026-02-21T08:50:00.000Z",
    updated_at: "2026-02-28T17:15:00.000Z",
    person_id: 2005,
    pipeline_id: PIPELINE_CAMPAIGN_ID,
    pipeline_stage_id: 3601,
    status: "won",
    value: 3600,
    origin: "whatsapp",
    won_time: "2026-02-28T17:15:00.000Z",
  }),
  createDeal({
    id: 1006,
    name: "Consumidor - Plano de Saúde",
    created_at: "2026-03-03T09:40:00.000Z",
    updated_at: "2026-03-15T14:35:00.000Z",
    person_id: 2006,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 6800,
    origin: "organic",
    won_time: "2026-03-15T14:35:00.000Z",
  }),
  createDeal({
    id: 1007,
    name: "Empresarial - Distrato Societário",
    created_at: "2026-03-09T11:15:00.000Z",
    updated_at: "2026-03-21T12:20:00.000Z",
    person_id: 2007,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 11_500,
    origin: "whatsapp",
    won_time: "2026-03-21T12:20:00.000Z",
  }),
  createDeal({
    id: 1008,
    name: "Tributário - Revisão Fiscal",
    created_at: "2026-03-18T16:00:00.000Z",
    updated_at: "2026-03-29T09:20:00.000Z",
    person_id: 2008,
    pipeline_id: PIPELINE_DEV_TEST_ID,
    pipeline_stage_id: 3701,
    status: "won",
    value: 4100,
    origin: "instagram",
    won_time: "2026-03-29T09:20:00.000Z",
  }),
  createDeal({
    id: 1009,
    name: "Imobiliário - Locação Comercial",
    created_at: "2026-04-01T10:10:00.000Z",
    updated_at: "2026-04-07T15:40:00.000Z",
    person_id: 2009,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 5300,
    origin: "facebook",
    won_time: "2026-04-07T15:40:00.000Z",
  }),
  createDeal({
    id: 1010,
    name: "Previdenciário - Aposentadoria",
    created_at: "2026-04-03T09:05:00.000Z",
    updated_at: "2026-04-09T11:50:00.000Z",
    person_id: 2010,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 3900,
    origin: "whatsapp",
    won_time: "2026-04-09T11:50:00.000Z",
  }),
  createDeal({
    id: 1011,
    name: "Civil - Cobrança Extrajudicial",
    created_at: "2026-04-05T12:30:00.000Z",
    updated_at: "2026-04-12T16:30:00.000Z",
    person_id: 2011,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 2800,
    origin: "whatsapp",
    won_time: "2026-04-12T16:30:00.000Z",
  }),
  createDeal({
    id: 1012,
    name: "Contratual - Startup Jurídica",
    created_at: "2026-04-06T14:20:00.000Z",
    updated_at: "2026-04-15T09:15:00.000Z",
    person_id: 2012,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3505,
    status: "won",
    value: 7700,
    origin: "referral",
    won_time: "2026-04-15T09:15:00.000Z",
  }),
  createDeal({
    id: 1013,
    name: "Inventário - Família Rocha",
    created_at: "2026-04-10T09:00:00.000Z",
    person_id: 2013,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3501,
    status: "open",
    value: 8300,
    origin: "whatsapp",
    qualification_status: "pending",
  }),
  createDeal({
    id: 1014,
    name: "Trabalhista - Verbas Rescisórias",
    created_at: "2026-04-10T13:20:00.000Z",
    person_id: 2014,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3502,
    status: "open",
    value: 6100,
    origin: "instagram",
    qualification_status: "qualified",
  }),
  createDeal({
    id: 1015,
    name: "Família - Pensão Alimentícia",
    created_at: "2026-04-11T08:45:00.000Z",
    person_id: 2015,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3503,
    status: "open",
    value: 4400,
    origin: "whatsapp",
  }),
  createDeal({
    id: 1016,
    name: "Empresarial - Contrato de Prestação",
    created_at: "2026-04-11T15:00:00.000Z",
    person_id: 2016,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3504,
    status: "open",
    value: 12_000,
    origin: "facebook",
  }),
  createDeal({
    id: 1017,
    name: "Consumidor - Banco Digital",
    created_at: "2026-04-12T10:30:00.000Z",
    person_id: 2017,
    pipeline_id: PIPELINE_CAMPAIGN_ID,
    pipeline_stage_id: 3601,
    status: "open",
    value: 3100,
    origin: "whatsapp",
    qualification_status: "pending",
  }),
  createDeal({
    id: 1018,
    name: "Imobiliário - Compra e Venda",
    created_at: "2026-04-13T11:30:00.000Z",
    person_id: 2018,
    pipeline_id: PIPELINE_DEV_TEST_ID,
    pipeline_stage_id: 3701,
    status: "open",
    value: 9700,
    origin: "organic",
  }),
  createDeal({
    id: 1019,
    name: "Tributário - Defesa Administrativa",
    created_at: "2026-04-14T09:30:00.000Z",
    person_id: 2019,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3502,
    status: "open",
    value: 15_000,
    origin: "referral",
  }),
  createDeal({
    id: 1020,
    name: "Civil - Indenização",
    created_at: "2026-04-15T14:00:00.000Z",
    person_id: 2020,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3501,
    status: "open",
    value: 5200,
    origin: "whatsapp",
    qualification_status: "pending",
  }),
  createDeal({
    id: 1021,
    name: "Criminal - Consulta Inicial",
    created_at: "2026-01-18T11:10:00.000Z",
    updated_at: "2026-01-22T18:10:00.000Z",
    person_id: 2021,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3502,
    status: "lost",
    value: 2400,
    origin: "whatsapp",
    lost_time: "2026-01-22T18:10:00.000Z",
    lost_reason: "Cliente optou por outro escritório",
    qualification_status: "unqualified",
  }),
  createDeal({
    id: 1022,
    name: "Família - Divórcio Consensual",
    created_at: "2026-02-12T10:00:00.000Z",
    updated_at: "2026-02-20T09:35:00.000Z",
    person_id: 2022,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3503,
    status: "lost",
    value: 3500,
    origin: "instagram",
    lost_time: "2026-02-20T09:35:00.000Z",
    lost_reason: "Sem orçamento disponível",
    qualification_status: "unqualified",
  }),
  createDeal({
    id: 1023,
    name: "Empresarial - Recuperação de Crédito",
    created_at: "2026-03-04T13:20:00.000Z",
    updated_at: "2026-03-18T17:55:00.000Z",
    person_id: 2023,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3504,
    status: "lost",
    value: 4800,
    origin: "facebook",
    lost_time: "2026-03-18T17:55:00.000Z",
    lost_reason: "Escopo fora da atuação",
    qualification_status: "unqualified",
  }),
  createDeal({
    id: 1024,
    name: "Previdenciário - BPC LOAS",
    created_at: "2026-04-02T08:10:00.000Z",
    updated_at: "2026-04-08T14:15:00.000Z",
    person_id: 2024,
    pipeline_id: PIPELINE_MAIN_ID,
    pipeline_stage_id: 3502,
    status: "lost",
    value: 1300,
    origin: "organic",
    lost_time: "2026-04-08T14:15:00.000Z",
    lost_reason: "Lead sem documentos mínimos",
    qualification_status: "unqualified",
  }),
];

function createConversation(
  overrides: Pick<
    ConversationRow,
    "id" | "created_at" | "updated_at" | "status" | "channel_id" | "deal_id"
  > &
    Partial<ConversationRow>,
): ConversationRow {
  const channel = channels.find((item) => item.id === overrides.channel_id);

  return {
    id: overrides.id,
    created_at: overrides.created_at,
    updated_at: overrides.updated_at,
    status: overrides.status,
    channel_id: overrides.channel_id,
    person_id: overrides.person_id ?? null,
    deal_id: overrides.deal_id,
    account_id: overrides.account_id ?? ACCOUNT_ID,
    created_by_user_id: overrides.created_by_user_id ?? null,
    last_message_at: overrides.last_message_at ?? overrides.updated_at,
    reply_to: overrides.reply_to ?? null,
    viewed_at: overrides.viewed_at ?? overrides.updated_at,
    channel_phone: overrides.channel_phone ?? channel?.phone ?? null,
    channel_type: overrides.channel_type ?? channel?.type ?? null,
    follow_up_count: overrides.follow_up_count ?? 0,
    is_paused: overrides.is_paused ?? false,
    intent: overrides.intent ?? null,
    summary: overrides.summary ?? null,
    agent_id: overrides.agent_id ?? null,
    channel_identifier:
      overrides.channel_identifier ?? channel?.identifier ?? null,
    contact_identifier: overrides.contact_identifier ?? null,
  };
}

const conversations = [
  createConversation({
    id: 5001,
    created_at: "2026-04-10T09:00:00.000Z",
    updated_at: "2026-04-10T09:12:00.000Z",
    status: "in_progress",
    channel_id: 101,
    deal_id: 1013,
    person_id: 2013,
    last_message_at: "2026-04-10T09:12:00.000Z",
    contact_identifier: "5511911110001",
    intent: "inventario",
    summary: "Lead solicitou orçamento para inventário familiar.",
  }),
  createConversation({
    id: 5002,
    created_at: "2026-04-10T13:20:00.000Z",
    updated_at: "2026-04-10T13:45:00.000Z",
    status: "in_progress",
    channel_id: 103,
    deal_id: 1014,
    person_id: 2014,
    last_message_at: "2026-04-10T13:45:00.000Z",
    contact_identifier: "ig_joao_lima",
    intent: "trabalhista",
    summary: "Lead descreveu verbas rescisórias pendentes.",
  }),
  createConversation({
    id: 5003,
    created_at: "2026-04-10T08:45:00.000Z",
    updated_at: "2026-04-10T09:18:00.000Z",
    status: "waiting_user",
    channel_id: 101,
    deal_id: 1015,
    person_id: 2015,
    last_message_at: "2026-04-11T09:18:00.000Z",
    contact_identifier: "5511911110003",
    follow_up_count: 1,
    intent: "familia",
  }),
  createConversation({
    id: 5004,
    created_at: "2026-04-12T10:30:00.000Z",
    updated_at: "2026-04-12T10:50:00.000Z",
    status: "in_progress",
    channel_id: 102,
    deal_id: 1017,
    person_id: 2017,
    last_message_at: "2026-04-12T10:50:00.000Z",
    contact_identifier: "5511911110004",
    intent: "consumidor",
  }),
  createConversation({
    id: 5005,
    created_at: "2026-04-13T11:30:00.000Z",
    updated_at: "2026-04-13T11:58:00.000Z",
    status: "in_progress",
    channel_id: 101,
    deal_id: 1018,
    person_id: 2018,
    last_message_at: "2026-04-13T11:58:00.000Z",
    contact_identifier: "5511911110005",
    intent: "imobiliario",
  }),
  createConversation({
    id: 5006,
    created_at: "2026-04-14T09:30:00.000Z",
    updated_at: "2026-04-14T10:05:00.000Z",
    status: "in_progress",
    channel_id: 101,
    deal_id: 1019,
    person_id: 2019,
    last_message_at: "2026-04-14T10:05:00.000Z",
    contact_identifier: "5511911110006",
    intent: "tributario",
  }),
  createConversation({
    id: 5007,
    created_at: "2026-04-15T14:00:00.000Z",
    updated_at: "2026-04-15T14:28:00.000Z",
    status: "waiting_user",
    channel_id: 101,
    deal_id: 1020,
    person_id: 2020,
    last_message_at: "2026-04-15T14:28:00.000Z",
    contact_identifier: "5511911110007",
    follow_up_count: 2,
    intent: "civil",
  }),
];

function createMessage(
  overrides: Pick<
    MessageRow,
    | "id"
    | "created_at"
    | "updated_at"
    | "direction"
    | "type"
    | "sender_type"
    | "conversation_id"
  > &
    Partial<MessageRow>,
): MessageRow {
  return {
    id: overrides.id,
    created_at: overrides.created_at,
    updated_at: overrides.updated_at,
    viewed_at: overrides.viewed_at ?? null,
    content: overrides.content ?? { text: "" },
    direction: overrides.direction,
    reaction: overrides.reaction ?? null,
    type: overrides.type,
    sender_type: overrides.sender_type,
    sender_id: overrides.sender_id ?? null,
    replied_to_message_id: overrides.replied_to_message_id ?? null,
    conversation_id: overrides.conversation_id,
    api_message_id: overrides.api_message_id ?? `mock-message-${overrides.id}`,
  };
}

const messages = [
  createMessage({
    id: 9001,
    created_at: "2026-04-10T09:00:00.000Z",
    updated_at: "2026-04-10T09:00:00.000Z",
    direction: "inbound",
    type: "text",
    sender_type: "contact",
    conversation_id: 5001,
    content: { text: "Preciso de ajuda com um inventário." },
  }),
  createMessage({
    id: 9002,
    created_at: "2026-04-10T09:12:00.000Z",
    updated_at: "2026-04-10T09:12:00.000Z",
    direction: "outbound",
    type: "text",
    sender_type: "agent",
    sender_id: "agent-1",
    conversation_id: 5001,
    content: { text: "Claro. Pode me informar os herdeiros envolvidos?" },
  }),
  createMessage({
    id: 9003,
    created_at: "2026-04-10T13:20:00.000Z",
    updated_at: "2026-04-10T13:20:00.000Z",
    direction: "inbound",
    type: "text",
    sender_type: "contact",
    conversation_id: 5002,
    content: { text: "Fui desligado e não recebi tudo." },
  }),
  createMessage({
    id: 9004,
    created_at: "2026-04-10T13:45:00.000Z",
    updated_at: "2026-04-10T13:45:00.000Z",
    direction: "outbound",
    type: "text",
    sender_type: "user",
    sender_id: USER_MEMBER_ID,
    conversation_id: 5002,
    content: { text: "Vamos analisar seu termo de rescisão." },
  }),
  createMessage({
    id: 9005,
    created_at: "2026-04-11T08:45:00.000Z",
    updated_at: "2026-04-11T08:45:00.000Z",
    direction: "inbound",
    type: "text",
    sender_type: "contact",
    conversation_id: 5003,
    content: { text: "Quero revisar o valor da pensão." },
  }),
  createMessage({
    id: 9006,
    created_at: "2026-04-12T10:50:00.000Z",
    updated_at: "2026-04-12T10:50:00.000Z",
    direction: "inbound",
    type: "audio",
    sender_type: "contact",
    conversation_id: 5004,
    content: { url: "mock://audio/consumer-case.ogg", duration_seconds: 42 },
  }),
  createMessage({
    id: 9007,
    created_at: "2026-04-13T11:58:00.000Z",
    updated_at: "2026-04-13T11:58:00.000Z",
    direction: "outbound",
    type: "text",
    sender_type: "agent",
    sender_id: "agent-1",
    conversation_id: 5005,
    content: { text: "Recebemos as informações do imóvel." },
  }),
  createMessage({
    id: 9008,
    created_at: "2026-04-14T10:05:00.000Z",
    updated_at: "2026-04-14T10:05:00.000Z",
    direction: "inbound",
    type: "document",
    sender_type: "contact",
    conversation_id: 5006,
    content: {
      url: "mock://documents/auto-infracao.pdf",
      file_name: "auto-infracao.pdf",
    },
  }),
  createMessage({
    id: 9009,
    created_at: "2026-04-15T14:28:00.000Z",
    updated_at: "2026-04-15T14:28:00.000Z",
    direction: "outbound",
    type: "text",
    sender_type: "user",
    sender_id: USER_MEMBER_ID,
    conversation_id: 5007,
    content: { text: "Podemos agendar uma análise inicial amanhã?" },
  }),
];

function normalizeDealStatus(status: string): DealStatusKey {
  if (status === "won" || status === "lost") {
    return status;
  }

  return "open";
}

function getDealStatusDate(deal: DealRow): string {
  if (deal.status === "won" && deal.won_time) {
    return deal.won_time;
  }

  if (deal.status === "lost" && deal.lost_time) {
    return deal.lost_time;
  }

  return deal.created_at;
}

function buildDealDistribution(sourceDeals: DealRow[]) {
  const distribution = sourceDeals.reduce(
    (accumulator, deal) => {
      const status = normalizeDealStatus(deal.status);

      accumulator[status].count += 1;
      accumulator[status].value += Number(deal.value ?? 0);

      return accumulator;
    },
    {
      open: { count: 0, value: 0 },
      won: { count: 0, value: 0 },
      lost: { count: 0, value: 0 },
    } satisfies Record<DealStatusKey, { count: number; value: number }>,
  );

  return {
    ...distribution,
    total: {
      count:
        distribution.open.count +
        distribution.won.count +
        distribution.lost.count,
      value:
        distribution.open.value +
        distribution.won.value +
        distribution.lost.value,
    },
  };
}

function buildMonthlyStatusChart(
  sourceDeals: DealRow[],
  status: DealStatusKey,
): DashboardChartPoint[] {
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai"];
  const monthlyCounts = monthLabels.map((label) => ({ label, value: 0 }));

  for (const deal of sourceDeals) {
    if (normalizeDealStatus(deal.status) !== status) {
      continue;
    }

    const monthIndex = new Date(getDealStatusDate(deal)).getUTCMonth();

    if (monthIndex >= 0 && monthIndex < monthlyCounts.length) {
      monthlyCounts[monthIndex].value += 1;
    }
  }

  return monthlyCounts;
}

function buildOrigins(sourceDeals: DealRow[]): DashboardOriginPoint[] {
  const originLabels: Record<string, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    organic: "Orgânico",
    referral: "Indicação",
    whatsapp: "WhatsApp",
  };

  const originColors: Record<string, string> = {
    whatsapp: "#7622e1",
    instagram: "#b588ef",
    facebook: "#ddc8f8",
    referral: "#f4edfd",
    organic: "#e9d8fd",
  };

  const counts = sourceDeals.reduce<Record<string, number>>(
    (accumulator, deal) => {
      const origin = deal.origin ?? "unknown";
      accumulator[origin] = (accumulator[origin] ?? 0) + 1;

      return accumulator;
    },
    {},
  );

  return Object.entries(counts)
    .map(([origin, count]) => ({
      origin: originLabels[origin] ?? origin,
      count,
      fill: originColors[origin] ?? "#f4edfd",
    }))
    .sort((a, b) => b.count - a.count);
}

function buildPipelineStages(sourceDeals: DealRow[]): DashboardStagePoint[] {
  const countsByStage = sourceDeals.reduce<Record<number, number>>(
    (accumulator, deal) => {
      if (normalizeDealStatus(deal.status) !== "open") {
        return accumulator;
      }

      accumulator[deal.pipeline_stage_id] =
        (accumulator[deal.pipeline_stage_id] ?? 0) + 1;

      return accumulator;
    },
    {},
  );

  return pipelineStages
    .filter((stage) => stage.pipeline_id === PIPELINE_MAIN_ID)
    .map((stage) => ({
      stage: stage.name,
      value: countsByStage[stage.id] ?? 0,
      fill: stage.color,
    }));
}

function buildConversationsByDay(
  sourceConversations: ConversationRow[],
): DashboardChartPoint[] {
  const dateLabels = [
    "2026-04-10",
    "2026-04-11",
    "2026-04-12",
    "2026-04-13",
    "2026-04-14",
    "2026-04-15",
    "2026-04-16",
  ];

  return dateLabels.map((date) => ({
    label: date,
    value: sourceConversations.filter((conversation) =>
      conversation.created_at.startsWith(date),
    ).length,
  }));
}

const activeDeals = deals.filter((deal) => deal.is_active);
const distribution = buildDealDistribution(activeDeals);

export const DASHBOARD_MOCKS = {
  rows: {
    account,
    users,
    pipelines,
    pipelineStages,
    channels,
    deals,
    conversations,
    messages,
  },
  account: {
    id: account.id,
    name: account.name,
    slug: account.slug,
    status: account.status,
    currency: account.currency,
  },
  filters: {
    pipelines: pipelines.map((pipeline) => ({
      id: String(pipeline.id),
      name: pipeline.name,
      slug: pipeline.slug,
      count: deals.filter(
        (deal) => deal.pipeline_id === pipeline.id && deal.is_active,
      ).length,
    })),
  },
  distribution,
  charts: {
    won: buildMonthlyStatusChart(activeDeals, "won"),
    lost: buildMonthlyStatusChart(activeDeals, "lost"),
    conversations: buildConversationsByDay(conversations),
  },
  origins: buildOrigins(activeDeals),
  stages: buildPipelineStages(activeDeals),
  limits: {
    deals: {
      used: activeDeals.length,
      limit: 500,
    },
    channels: {
      used: channels.filter((channel) => channel.is_active).length,
      limit: 3,
    },
    users: {
      used: users.filter((user) => user.status === "active").length,
      limit: 5,
    },
  },
  lawAssistant: {
    id: "asst_01",
    name: "Ana Júlia",
    description:
      "Especialista em Triagem e Qualificação de Leads para Direito de Família e Sucessões. Focada em coletar dados iniciais e agendar consultas.",
    status: "active" as const,
    practiceAreas: [
      { id: "1", name: "Família", color: "var(--primary)" },
      { id: "2", name: "Sucessões", color: "var(--primary)" },
      { id: "3", name: "Inventários", color: "var(--primary)" },
    ],
    followUp: {
      intervalMinutes: 300,
      startHour: 9,
      endHour: 18,
    },
    metrics: {
      totalConversations: 124,
      qualifiedLeads: 42,
      conversionRate: 34,
      avgResponseTime: "2m",
      followUpsSent: 156,
    },
    createdAt: "2026-04-01T10:00:00Z",
    whatsapp: {
      name: "WhatsApp Principal",
      phone: "+55 11 99999-0000",
      status: "Conectado",
      instanceId: "inst_01",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
    },
  },
} as const;

export type DashboardMocks = typeof DASHBOARD_MOCKS;
