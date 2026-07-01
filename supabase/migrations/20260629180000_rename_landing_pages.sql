-- Migration: renomeia gerador_landing_pages → landing_pages
-- Idempotente: seguro reexecutar.

-- ============================================================
-- 1. Tabela
-- ============================================================
DO $$
BEGIN
  IF to_regclass('public.gerador_landing_pages') IS NOT NULL THEN
    ALTER TABLE public.gerador_landing_pages RENAME TO landing_pages;
  END IF;
END $$;

-- ============================================================
-- 2. Constraints
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gerador_landing_pages_pkey'
  ) THEN
    ALTER TABLE public.landing_pages
      RENAME CONSTRAINT gerador_landing_pages_pkey TO landing_pages_pkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gerador_landing_pages_profile_fk'
  ) THEN
    ALTER TABLE public.landing_pages
      RENAME CONSTRAINT gerador_landing_pages_profile_fk TO landing_pages_profile_fk;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gerador_landing_pages_slug_uk'
  ) THEN
    ALTER TABLE public.landing_pages
      RENAME CONSTRAINT gerador_landing_pages_slug_uk TO landing_pages_slug_uk;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'gerador_landing_pages_user_slug_uk'
  ) THEN
    ALTER TABLE public.landing_pages
      RENAME CONSTRAINT gerador_landing_pages_user_slug_uk TO landing_pages_user_slug_uk;
  END IF;
END $$;

-- ============================================================
-- 3. Índices
-- ============================================================
ALTER INDEX IF EXISTS public.idx_gerador_landing_pages_user
  RENAME TO idx_landing_pages_user;

ALTER INDEX IF EXISTS public.idx_gerador_landing_pages_profile
  RENAME TO idx_landing_pages_profile;

ALTER INDEX IF EXISTS public.idx_gerador_landing_pages_schema
  RENAME TO idx_landing_pages_schema;

ALTER INDEX IF EXISTS public.idx_gerador_landing_pages_slug_status
  RENAME TO idx_landing_pages_slug_status;

ALTER INDEX IF EXISTS public.idx_gerador_landing_pages_user_status
  RENAME TO idx_landing_pages_user_status;

-- ============================================================
-- 4. Trigger
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'landing_pages'
      AND t.tgname = 'trg_gerador_landing_pages_updated_at'
      AND NOT t.tgisinternal
  ) THEN
    ALTER TRIGGER trg_gerador_landing_pages_updated_at
      ON public.landing_pages
      RENAME TO trg_landing_pages_updated_at;
  END IF;
END $$;
