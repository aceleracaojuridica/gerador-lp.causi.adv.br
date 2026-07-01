-- Migration: RLS em landing_pages, galeria de imagens por conta, policies de Storage.
-- Idempotente: seguro reexecutar.

-- ============================================================
-- 1. landing_pages — escopo por conta
-- ============================================================
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS account_id bigint,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid;

-- Backfill created_by_user_id a partir de causi_user_id (UUID válido)
UPDATE public.landing_pages
SET created_by_user_id = causi_user_id::uuid
WHERE created_by_user_id IS NULL
  AND causi_user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- account_id temporário: 0 para linhas sem backfill (script separado preenche)
UPDATE public.landing_pages
SET account_id = 0
WHERE account_id IS NULL;

UPDATE public.landing_pages
SET created_by_user_id = '00000000-0000-0000-0000-000000000001'::uuid
WHERE created_by_user_id IS NULL;

ALTER TABLE public.landing_pages
  ALTER COLUMN account_id SET NOT NULL,
  ALTER COLUMN created_by_user_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_landing_pages_account_updated
  ON public.landing_pages (account_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_landing_pages_created_by
  ON public.landing_pages (created_by_user_id);

-- ============================================================
-- 2. Galeria de imagens
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lp_account_images (
  id                   uuid        NOT NULL DEFAULT gen_random_uuid(),
  account_id           bigint      NOT NULL,
  uploaded_by_user_id  uuid        NOT NULL,
  storage_path         text        NOT NULL,
  original_filename    text,
  mime_type            text        NOT NULL DEFAULT 'image/webp',
  size_bytes           bigint      NOT NULL DEFAULT 0,
  width                int,
  height               int,
  created_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_account_images_pkey PRIMARY KEY (id),
  CONSTRAINT lp_account_images_storage_path_uk UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_lp_account_images_account
  ON public.lp_account_images (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lp_account_images_uploader
  ON public.lp_account_images (uploaded_by_user_id);

CREATE TABLE IF NOT EXISTS public.lp_image_usages (
  id               bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  image_id         uuid NOT NULL,
  landing_page_id  uuid NOT NULL,
  slot             text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_image_usages_pkey PRIMARY KEY (id),
  CONSTRAINT lp_image_usages_image_fk
    FOREIGN KEY (image_id) REFERENCES public.lp_account_images (id) ON DELETE RESTRICT,
  CONSTRAINT lp_image_usages_lp_fk
    FOREIGN KEY (landing_page_id) REFERENCES public.landing_pages (id) ON DELETE CASCADE,
  CONSTRAINT lp_image_usages_lp_slot_uk UNIQUE (landing_page_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_lp_image_usages_image
  ON public.lp_image_usages (image_id);

-- View: resumo de uso por imagem
CREATE OR REPLACE VIEW public.lp_image_usage_summary AS
SELECT
  i.id AS image_id,
  i.account_id,
  i.storage_path,
  i.uploaded_by_user_id,
  i.original_filename,
  i.size_bytes,
  i.created_at,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'landing_page_id', lp.id,
        'slug', lp.slug,
        'name', lp.name,
        'slot', u.slot
      )
    ) FILTER (WHERE u.id IS NOT NULL),
    '[]'::jsonb
  ) AS usages
FROM public.lp_account_images i
LEFT JOIN public.lp_image_usages u ON u.image_id = i.id
LEFT JOIN public.landing_pages lp ON lp.id = u.landing_page_id
GROUP BY i.id;

-- Trigger: bloqueia DELETE de imagem em uso
CREATE OR REPLACE FUNCTION public.lp_prevent_image_delete_if_used()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_names text;
BEGIN
  SELECT string_agg(lp.name, ', ' ORDER BY lp.name)
  INTO usage_names
  FROM public.lp_image_usages u
  JOIN public.landing_pages lp ON lp.id = u.landing_page_id
  WHERE u.image_id = OLD.id;

  IF usage_names IS NOT NULL THEN
    RAISE EXCEPTION 'LP_IMAGE_IN_USE:%', usage_names
      USING ERRCODE = 'P0001';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_lp_prevent_image_delete ON public.lp_account_images;
CREATE TRIGGER trg_lp_prevent_image_delete
  BEFORE DELETE ON public.lp_account_images
  FOR EACH ROW
  EXECUTE FUNCTION public.lp_prevent_image_delete_if_used();

-- ============================================================
-- 3. Funções helper JWT (claims injetados pelo servidor)
-- ============================================================
CREATE OR REPLACE FUNCTION public.lp_jwt_account_id()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(auth.jwt() ->> 'account_id', '')::bigint;
$$;

CREATE OR REPLACE FUNCTION public.lp_jwt_access_level()
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(auth.jwt() ->> 'access_level', '')::int, 0);
$$;

CREATE OR REPLACE FUNCTION public.lp_is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.lp_jwt_access_level() >= 999;
$$;

CREATE OR REPLACE FUNCTION public.lp_is_account_owner()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT public.lp_jwt_access_level() >= 100;
$$;

CREATE OR REPLACE FUNCTION public.lp_user_in_account(p_account_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_account_id = public.lp_jwt_account_id();
$$;

CREATE OR REPLACE FUNCTION public.lp_can_edit_landing_page(p_created_by uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.lp_is_super_admin()
    OR public.lp_is_account_owner()
    OR p_created_by = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.lp_can_delete_image(p_uploaded_by uuid, p_image_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.lp_is_super_admin()
    OR public.lp_is_account_owner()
    OR (
      p_uploaded_by = auth.uid()
      AND NOT EXISTS (
        SELECT 1 FROM public.lp_image_usages u WHERE u.image_id = p_image_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.lp_gallery_storage_prefix()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT public.lp_jwt_account_id()::text || '/gallery/';
$$;

-- ============================================================
-- 4. RLS landing_pages
-- ============================================================
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landing_pages_select_account ON public.landing_pages;
CREATE POLICY landing_pages_select_account ON public.landing_pages
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS landing_pages_select_public ON public.landing_pages;
CREATE POLICY landing_pages_select_public ON public.landing_pages
  FOR SELECT TO anon
  USING (status = 'published');

DROP POLICY IF EXISTS landing_pages_insert ON public.landing_pages;
CREATE POLICY landing_pages_insert ON public.landing_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND created_by_user_id = auth.uid()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS landing_pages_update ON public.landing_pages;
CREATE POLICY landing_pages_update ON public.landing_pages
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_can_edit_landing_page(created_by_user_id)
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_can_edit_landing_page(created_by_user_id)
  );

DROP POLICY IF EXISTS landing_pages_delete ON public.landing_pages;
CREATE POLICY landing_pages_delete ON public.landing_pages
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND (public.lp_is_account_owner() OR public.lp_is_super_admin())
  );

DROP POLICY IF EXISTS landing_pages_super_admin ON public.landing_pages;
CREATE POLICY landing_pages_super_admin ON public.landing_pages
  FOR ALL TO authenticated
  USING (public.lp_is_super_admin())
  WITH CHECK (public.lp_is_super_admin());

-- ============================================================
-- 5. RLS lp_account_images
-- ============================================================
ALTER TABLE public.lp_account_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_images_select ON public.lp_account_images;
CREATE POLICY lp_images_select ON public.lp_account_images
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS lp_images_insert ON public.lp_account_images;
CREATE POLICY lp_images_insert ON public.lp_account_images
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND uploaded_by_user_id = auth.uid()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_images_update ON public.lp_account_images;
CREATE POLICY lp_images_update ON public.lp_account_images
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_can_delete_image(uploaded_by_user_id, id)
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND uploaded_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_images_delete ON public.lp_account_images;
CREATE POLICY lp_images_delete ON public.lp_account_images
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_can_delete_image(uploaded_by_user_id, id)
  );

DROP POLICY IF EXISTS lp_images_super_admin ON public.lp_account_images;
CREATE POLICY lp_images_super_admin ON public.lp_account_images
  FOR ALL TO authenticated
  USING (public.lp_is_super_admin())
  WITH CHECK (public.lp_is_super_admin());

-- ============================================================
-- 6. RLS lp_image_usages
-- ============================================================
ALTER TABLE public.lp_image_usages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_usages_select ON public.lp_image_usages;
CREATE POLICY lp_usages_select ON public.lp_image_usages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_account_images i
      WHERE i.id = image_id AND public.lp_user_in_account(i.account_id)
    )
  );

DROP POLICY IF EXISTS lp_usages_insert ON public.lp_image_usages;
CREATE POLICY lp_usages_insert ON public.lp_image_usages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lp_account_images i
      WHERE i.id = image_id AND public.lp_user_in_account(i.account_id)
    )
    AND EXISTS (
      SELECT 1 FROM public.landing_pages lp
      WHERE lp.id = landing_page_id
        AND public.lp_user_in_account(lp.account_id)
        AND public.lp_can_edit_landing_page(lp.created_by_user_id)
    )
  );

DROP POLICY IF EXISTS lp_usages_delete ON public.lp_image_usages;
CREATE POLICY lp_usages_delete ON public.lp_image_usages
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.landing_pages lp
      WHERE lp.id = landing_page_id
        AND public.lp_user_in_account(lp.account_id)
        AND public.lp_can_edit_landing_page(lp.created_by_user_id)
    )
  );

DROP POLICY IF EXISTS lp_usages_super_admin ON public.lp_image_usages;
CREATE POLICY lp_usages_super_admin ON public.lp_image_usages
  FOR ALL TO authenticated
  USING (public.lp_is_super_admin())
  WITH CHECK (public.lp_is_super_admin());

-- ============================================================
-- 7. Storage policies — gerador-lp-assets
-- ============================================================
DROP POLICY IF EXISTS gerador_lp_assets_public_read ON storage.objects;
CREATE POLICY gerador_lp_assets_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'gerador-lp-assets');

DROP POLICY IF EXISTS gerador_lp_assets_insert_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_insert_gallery ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gerador-lp-assets'
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  );

DROP POLICY IF EXISTS gerador_lp_assets_update_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_update_gallery ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gerador-lp-assets'
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  )
  WITH CHECK (
    bucket_id = 'gerador-lp-assets'
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  );

DROP POLICY IF EXISTS gerador_lp_assets_delete_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_delete_gallery ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gerador-lp-assets'
    AND (
      public.lp_is_super_admin()
      OR public.lp_is_account_owner()
      OR (
        name LIKE public.lp_gallery_storage_prefix() || '%'
        AND EXISTS (
          SELECT 1 FROM public.lp_account_images i
          WHERE i.storage_path = name
            AND i.uploaded_by_user_id = auth.uid()
            AND public.lp_can_delete_image(i.uploaded_by_user_id, i.id)
        )
      )
    )
  );
