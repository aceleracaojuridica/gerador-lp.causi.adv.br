-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  subdomain text NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id text NOT NULL UNIQUE,
  heading_font text NOT NULL DEFAULT ''::text,
  body_font text NOT NULL DEFAULT ''::text,
  tracking_tags jsonb NOT NULL DEFAULT '{"body": "", "head": "", "footer": ""}'::jsonb,
  custom_domain text NOT NULL DEFAULT ''::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id)
);

CREATE TABLE public.leads (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  nome text,
  telefone text,
  page_url text,
  subdomain text,
  CONSTRAINT leads_pkey PRIMARY KEY (id)
);

CREATE TABLE public.landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id text NOT NULL,
  account_id bigint NOT NULL,
  created_by_user_id uuid NOT NULL,
  profile_id uuid,
  slug text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT ''::text,
  tema text NOT NULL DEFAULT ''::text,
  schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'draft'::text,
  published_at timestamp with time zone,
  CONSTRAINT landing_pages_pkey PRIMARY KEY (id),
  CONSTRAINT landing_pages_profile_fk FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE public.lp_account_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  account_id bigint NOT NULL,
  uploaded_by_user_id uuid NOT NULL,
  storage_path text NOT NULL UNIQUE,
  original_filename text,
  mime_type text NOT NULL DEFAULT 'image/webp',
  size_bytes bigint NOT NULL DEFAULT 0,
  width int,
  height int,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lp_account_images_pkey PRIMARY KEY (id)
);

CREATE TABLE public.lp_image_usages (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  image_id uuid NOT NULL,
  landing_page_id uuid NOT NULL,
  slot text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lp_image_usages_pkey PRIMARY KEY (id),
  CONSTRAINT lp_image_usages_image_fk FOREIGN KEY (image_id) REFERENCES public.lp_account_images(id),
  CONSTRAINT lp_image_usages_lp_fk FOREIGN KEY (landing_page_id) REFERENCES public.landing_pages(id),
  CONSTRAINT lp_image_usages_lp_slot_uk UNIQUE (landing_page_id, slot)
);
