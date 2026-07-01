-- Migration: office_subdomain por conta + slug de LP único por account_id.
-- Idempotente: seguro reexecutar.

ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS office_subdomain text;

-- Backfill temporário até o app gravar o valor derivado do nome da conta.
UPDATE public.landing_pages
SET office_subdomain = 'acct-' || account_id::text
WHERE office_subdomain IS NULL;

ALTER TABLE public.landing_pages
  ALTER COLUMN office_subdomain SET NOT NULL;

ALTER TABLE public.landing_pages
  DROP CONSTRAINT IF EXISTS landing_pages_slug_uk;

ALTER TABLE public.landing_pages
  DROP CONSTRAINT IF EXISTS gerador_landing_pages_slug_uk;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'landing_pages_account_slug_uk'
  ) THEN
    ALTER TABLE public.landing_pages
      ADD CONSTRAINT landing_pages_account_slug_uk UNIQUE (account_id, slug);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_landing_pages_public
  ON public.landing_pages (office_subdomain, slug)
  WHERE status = 'published';
