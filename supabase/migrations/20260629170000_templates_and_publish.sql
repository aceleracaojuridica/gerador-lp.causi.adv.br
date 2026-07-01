-- Migration: template_id + status (draft/published) + slug único global.
-- Idempotente: seguro reexecutar.

-- ============================================================
-- 1. Novas colunas
-- ============================================================
ALTER TABLE public.gerador_landing_pages
  ADD COLUMN IF NOT EXISTS template_id  TEXT        NOT NULL DEFAULT 'classic-light',
  ADD COLUMN IF NOT EXISTS status       TEXT        NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ          NULL;

-- ============================================================
-- 2. Resolve colisões de slug entre usuários antes de torná-lo global
--    Renomeia duplicatas: slug → slug-2, slug-3, ...
-- ============================================================
DO $$
DECLARE
  rec RECORD;
  new_slug TEXT;
  counter  INT;
BEGIN
  FOR rec IN
    SELECT id, slug
    FROM public.gerador_landing_pages
    WHERE slug IN (
      SELECT slug
      FROM public.gerador_landing_pages
      GROUP BY slug
      HAVING COUNT(*) > 1
    )
    ORDER BY slug, created_at ASC
    OFFSET 1  -- mantém o primeiro, renomeia os demais
  LOOP
    counter := 2;
    LOOP
      new_slug := rec.slug || '-' || counter;
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.gerador_landing_pages WHERE slug = new_slug
      );
      counter := counter + 1;
    END LOOP;

    UPDATE public.gerador_landing_pages
    SET slug = new_slug
    WHERE id = rec.id;
  END LOOP;
END $$;

-- ============================================================
-- 3. Troca constraint composta por unique global
-- ============================================================
ALTER TABLE public.gerador_landing_pages
  DROP CONSTRAINT IF EXISTS gerador_landing_pages_user_slug_uk;

ALTER TABLE public.gerador_landing_pages
  ADD CONSTRAINT gerador_landing_pages_slug_uk UNIQUE (slug);

-- ============================================================
-- 4. Índices para busca por status e slug
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gerador_landing_pages_slug_status
  ON public.gerador_landing_pages (slug, status);

CREATE INDEX IF NOT EXISTS idx_gerador_landing_pages_user_status
  ON public.gerador_landing_pages (causi_user_id, status);
