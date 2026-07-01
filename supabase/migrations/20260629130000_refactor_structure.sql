-- Migration: schema inicial do Projeto B (Gerador LP + Lovable)
-- Compartilhado com Lovable: profiles (LPs/subdomínios) + leads.
-- Ordem: functions → profiles → users → user_settings → leads → RLS → indexes

-- ------------------------------------------------------------
-- Função: atualiza updated_at automaticamente
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Função: garante que o usuário existe antes de inserir em
-- user_settings, evitando FK violation quando o código
-- ainda não provisionou o usuário explicitamente.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ensure_user_exists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (causi_user_id, email)
  VALUES (NEW.causi_user_id, '')
  ON CONFLICT (causi_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- public.profiles  — Lovable + Gerador LP
-- Subdomínio publicado (Lovable) e páginas do gerador em `pages`.
-- Lovable usa id + subdomain + created_at; o gerador grava LPs em pages (jsonb).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid NOT NULL,
  subdomain  text NOT NULL,
  pages      jsonb NOT NULL DEFAULT '[]',
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT profiles_pkey     PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey  FOREIGN KEY (id) REFERENCES auth.users (id),
  CONSTRAINT profiles_subdomain_uk UNIQUE (subdomain)
);

-- Migração: adiciona coluna em bancos que já tinham profiles só do Lovable
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pages jsonb NOT NULL DEFAULT '[]';

-- ============================================================
-- public.users
-- Espelho local do usuário Causi (auth.users do Projeto A).
-- Identificador de escopo em user_settings: causi_user_id.
-- NOTA: a coluna `plan` não é usada em runtime — plano vem
-- exclusivamente via RPC get_current_user_details_v4 (Projeto A).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id  text        NOT NULL,
  email          text        NOT NULL DEFAULT '',
  plan           text        NOT NULL DEFAULT 'free', -- espelho; não usar para autorização
  last_synced_at timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey              PRIMARY KEY (id),
  CONSTRAINT users_causi_user_id_uk  UNIQUE (causi_user_id)
);

-- ============================================================
-- public.user_settings
-- Configurações globais por usuário (vale para todas as LPs).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id  text        NOT NULL,
  heading_font   text        NOT NULL DEFAULT '',
  body_font      text        NOT NULL DEFAULT '',
  tracking_tags  jsonb       NOT NULL DEFAULT '{"head": "", "body": "", "footer": ""}',
  custom_domain  text        NOT NULL DEFAULT '',  -- domínio customizado pós-MVP
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey          PRIMARY KEY (id),
  CONSTRAINT user_settings_causi_user_uk UNIQUE (causi_user_id),
  CONSTRAINT user_settings_causi_user_fk FOREIGN KEY (causi_user_id)
    REFERENCES public.users (causi_user_id) ON DELETE CASCADE
);

CREATE OR REPLACE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_user_settings_ensure_user
  BEFORE INSERT ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.ensure_user_exists();

-- ============================================================
-- public.leads  — Lovable + Gerador LP
-- Leads capturados em sites publicados (escopo por subdomain).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id         bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamptz DEFAULT now(),
  nome       text,
  telefone   text,
  page_url   text,
  subdomain  text,
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);

-- ============================================================
-- Row Level Security — profiles + leads (Lovable + Gerador)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS leads_insert_anon ON public.leads;
CREATE POLICY leads_insert_anon ON public.leads
  FOR INSERT TO anon WITH CHECK (subdomain IS NOT NULL);

DROP POLICY IF EXISTS leads_select_own ON public.leads;
CREATE POLICY leads_select_own ON public.leads
  FOR SELECT TO authenticated
  USING (
    subdomain IN (
      SELECT subdomain FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_pages ON public.profiles USING gin (pages);

CREATE INDEX IF NOT EXISTS idx_leads_subdomain_created
  ON public.leads (subdomain, created_at DESC);
