-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT ''::text,
  plan text NOT NULL DEFAULT 'free'::text,
  last_synced_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id text NOT NULL UNIQUE,
  heading_font text NOT NULL DEFAULT ''::text,
  body_font text NOT NULL DEFAULT ''::text,
  tracking_tags jsonb NOT NULL DEFAULT '{"body": "", "head": "", "footer": ""}'::jsonb,
  custom_domain text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_causi_user_id_fkey FOREIGN KEY (causi_user_id) REFERENCES public.users(causi_user_id)
);
CREATE TABLE public.leads_gerador (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lp_id uuid,
  causi_user_id text NOT NULL,
  client_slug text NOT NULL DEFAULT ''::text,
  name text,
  phone text,
  email text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  page_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT leads_gerador_pkey PRIMARY KEY (id),
  CONSTRAINT leads_lp_id_fkey FOREIGN KEY (lp_id) REFERENCES public.lps(id)
);
