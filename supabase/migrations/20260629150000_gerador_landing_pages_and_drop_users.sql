-- Migration: landing pages do gerador em tabela própria + remoção de users.
-- Não altera o schema Lovable (profiles sem coluna pages).
-- Idempotente: seguro reexecutar.

-- ============================================================
-- 1. public.gerador_landing_pages (CRM / schema JSON do gerador)
--    profile_id opcional → vínculo com Lovable quando existir.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gerador_landing_pages (
  id             uuid        NOT NULL DEFAULT gen_random_uuid(),
  causi_user_id  text        NOT NULL,
  profile_id     uuid        NULL,
  slug           text        NOT NULL,
  name           text        NOT NULL DEFAULT '',
  tema           text        NOT NULL DEFAULT '',
  schema         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gerador_landing_pages_pkey PRIMARY KEY (id),
  CONSTRAINT gerador_landing_pages_user_slug_uk UNIQUE (causi_user_id, slug),
  CONSTRAINT gerador_landing_pages_profile_fk
    FOREIGN KEY (profile_id) REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_gerador_landing_pages_user
  ON public.gerador_landing_pages (causi_user_id);

CREATE INDEX IF NOT EXISTS idx_gerador_landing_pages_profile
  ON public.gerador_landing_pages (profile_id)
  WHERE profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_gerador_landing_pages_schema
  ON public.gerador_landing_pages USING gin (schema);

DROP TRIGGER IF EXISTS trg_gerador_landing_pages_updated_at ON public.gerador_landing_pages;
CREATE TRIGGER trg_gerador_landing_pages_updated_at
  BEFORE UPDATE ON public.gerador_landing_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. lps → gerador_landing_pages (se tabela legada ainda existir)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lps'
  ) THEN
    RAISE NOTICE 'public.lps não existe — etapa 2 ignorada.';
    RETURN;
  END IF;

  INSERT INTO public.gerador_landing_pages (
    causi_user_id, profile_id, slug, name, tema, schema, created_at, updated_at
  )
  SELECT
    l.causi_user_id,
    CASE
      WHEN l.causi_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = l.causi_user_id::uuid)
      THEN l.causi_user_id::uuid
      ELSE NULL
    END,
    l.slug,
    l.name,
    l.tema,
    l.schema,
    COALESCE(l.updated_at, now()),
    COALESCE(l.updated_at, now())
  FROM public.lps l
  WHERE l.slug IS NOT NULL AND l.slug <> ''
  ON CONFLICT (causi_user_id, slug) DO UPDATE
    SET
      name = EXCLUDED.name,
      tema = EXCLUDED.tema,
      schema = EXCLUDED.schema,
      updated_at = EXCLUDED.updated_at,
      profile_id = COALESCE(gerador_landing_pages.profile_id, EXCLUDED.profile_id);

  RAISE NOTICE 'Migração lps → gerador_landing_pages concluída.';
END $$;

-- ============================================================
-- 3. profiles.pages → gerador_landing_pages (dados legados na coluna)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'pages'
  ) THEN
    RAISE NOTICE 'profiles.pages não existe — etapa 3 ignorada.';
    RETURN;
  END IF;

  INSERT INTO public.gerador_landing_pages (
    causi_user_id, profile_id, slug, name, tema, schema
  )
  SELECT
    p.id::text,
    p.id,
    elem->>'slug',
    COALESCE(elem->>'name', elem->>'slug', ''),
    COALESCE(elem->>'tema', ''),
    COALESCE(elem->'schema', '{}'::jsonb)
  FROM public.profiles p
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(p.pages, '[]'::jsonb)) AS elem
  WHERE elem->>'slug' IS NOT NULL AND elem->>'slug' <> ''
  ON CONFLICT (causi_user_id, slug) DO NOTHING;

  RAISE NOTICE 'Migração profiles.pages → gerador_landing_pages concluída.';
END $$;

-- Remove coluna pages do Lovable (gerador não usa mais profiles.pages)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS pages;
DROP INDEX IF EXISTS idx_profiles_pages;

-- ============================================================
-- 4. leads_gerador → leads (idempotente; mesma lógica da migration anterior)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_gerador'
  ) THEN
    RAISE NOTICE 'public.leads_gerador não existe — etapa 4 ignorada.';
    RETURN;
  END IF;

  INSERT INTO public.leads (created_at, nome, telefone, page_url, subdomain)
  SELECT
    lg.created_at,
    lg.name,
    lg.phone,
    lg.page_url,
    COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain)
  FROM public.leads_gerador lg
  LEFT JOIN public.profiles pr ON pr.id::text = lg.causi_user_id
  WHERE COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain) IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.leads existing
      WHERE existing.created_at IS NOT DISTINCT FROM lg.created_at
        AND existing.nome IS NOT DISTINCT FROM lg.name
        AND existing.telefone IS NOT DISTINCT FROM lg.phone
        AND existing.subdomain IS NOT DISTINCT FROM COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain)
        AND existing.page_url IS NOT DISTINCT FROM lg.page_url
    );

  RAISE NOTICE 'Migração leads_gerador → leads concluída.';
END $$;

-- ============================================================
-- 5. Remover tabelas legadas
-- ============================================================
DROP TRIGGER IF EXISTS trg_lps_ensure_user ON public.lps;
DROP TRIGGER IF EXISTS trg_lps_updated_at ON public.lps;
DROP TABLE IF EXISTS public.leads_gerador;
DROP TABLE IF EXISTS public.lps;

-- ============================================================
-- 6. Remover public.users (identidade vem do Causi via auth / RPC)
-- ============================================================
ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_causi_user_fk;

ALTER TABLE public.user_settings
  DROP CONSTRAINT IF EXISTS user_settings_causi_user_id_fkey;

DROP TRIGGER IF EXISTS trg_user_settings_ensure_user ON public.user_settings;
DROP FUNCTION IF EXISTS public.ensure_user_exists();

DROP TABLE IF EXISTS public.users;
