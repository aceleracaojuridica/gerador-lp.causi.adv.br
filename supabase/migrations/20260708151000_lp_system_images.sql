-- Migration: catálogo global de imagens padrão (somente leitura no app).
-- Idempotente: seguro reexecutar.

-- ============================================================
-- 1. Catálogo global de imagens padrão
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lp_system_images (
  id            uuid        NOT NULL DEFAULT gen_random_uuid(),
  storage_path  text        NOT NULL,
  public_url    text        NOT NULL,
  section_key   text        NOT NULL,
  label         text        NOT NULL DEFAULT 'Imagem do sistema',
  sort_order    int         NOT NULL DEFAULT 0,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_system_images_pkey PRIMARY KEY (id),
  CONSTRAINT lp_system_images_storage_path_uk UNIQUE (storage_path)
);

CREATE INDEX IF NOT EXISTS idx_lp_system_images_section_active
  ON public.lp_system_images (section_key, is_active, sort_order, created_at DESC);

ALTER TABLE public.lp_system_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_system_images_select ON public.lp_system_images;
CREATE POLICY lp_system_images_select ON public.lp_system_images
  FOR SELECT TO authenticated
  USING (public.lp_jwt_account_id() IS NOT NULL AND is_active = true);

-- Não criar policies de INSERT/UPDATE/DELETE para authenticated:
-- mutações ficam restritas ao dashboard/admin do projeto Supabase.

-- ============================================================
-- 2. Storage: proteger prefixo global de sistema
-- ============================================================
-- Mantém leitura pública no bucket já coberta por gerador_lp_assets_public_read.
-- Reforça escrita apenas no prefixo gallery da conta.

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
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
    AND (
      public.lp_is_super_admin()
      OR public.lp_is_account_owner()
      OR EXISTS (
        SELECT 1 FROM public.lp_account_images i
        WHERE i.storage_path = name
          AND i.uploaded_by_user_id = auth.uid()
          AND public.lp_can_delete_image(i.uploaded_by_user_id, i.id)
      )
    )
  );
