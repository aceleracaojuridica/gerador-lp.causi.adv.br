-- Migration: entitlement de acesso LP por conta (billing) + RLS em SELECT e mutações.
-- Idempotente: seguro reexecutar.

ALTER TABLE public.lp_accounts
  ADD COLUMN IF NOT EXISTS lp_access_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.lp_account_access_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (
      SELECT lp_access_enabled
      FROM public.lp_accounts
      WHERE id = public.lp_jwt_account_id()
    ),
    false
  );
$$;

-- ============================================================
-- landing_pages
-- ============================================================
DROP POLICY IF EXISTS landing_pages_select_account ON public.landing_pages;
CREATE POLICY landing_pages_select_account ON public.landing_pages
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS landing_pages_insert ON public.landing_pages;
CREATE POLICY landing_pages_insert ON public.landing_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND created_by_user_id = auth.uid()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS landing_pages_update ON public.landing_pages;
CREATE POLICY landing_pages_update ON public.landing_pages
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND public.lp_can_edit_landing_page(created_by_user_id)
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND public.lp_can_edit_landing_page(created_by_user_id)
  );

DROP POLICY IF EXISTS landing_pages_delete ON public.landing_pages;
CREATE POLICY landing_pages_delete ON public.landing_pages
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND (public.lp_is_account_owner() OR public.lp_is_super_admin())
  );

-- ============================================================
-- lp_accounts
-- ============================================================
DROP POLICY IF EXISTS lp_accounts_select ON public.lp_accounts;
CREATE POLICY lp_accounts_select ON public.lp_accounts
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_accounts_update ON public.lp_accounts;
CREATE POLICY lp_accounts_update ON public.lp_accounts
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(id)
    AND public.lp_account_access_enabled()
  )
  WITH CHECK (
    public.lp_user_in_account(id)
    AND id = public.lp_jwt_account_id()
    AND public.lp_is_account_owner()
    AND public.lp_account_access_enabled()
  );

-- ============================================================
-- lp_account_settings
-- ============================================================
DROP POLICY IF EXISTS lp_account_settings_select ON public.lp_account_settings;
CREATE POLICY lp_account_settings_select ON public.lp_account_settings
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_account_settings_insert ON public.lp_account_settings;
CREATE POLICY lp_account_settings_insert ON public.lp_account_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
    AND updated_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_account_settings_update ON public.lp_account_settings;
CREATE POLICY lp_account_settings_update ON public.lp_account_settings
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
    AND updated_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_account_settings_delete ON public.lp_account_settings;
CREATE POLICY lp_account_settings_delete ON public.lp_account_settings
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND (public.lp_is_account_owner() OR public.lp_is_super_admin())
  );

-- ============================================================
-- lp_account_addresses
-- ============================================================
DROP POLICY IF EXISTS lp_account_addresses_select ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_select ON public.lp_account_addresses
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_account_addresses_insert ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_insert ON public.lp_account_addresses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_addresses_update ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_update ON public.lp_account_addresses
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_addresses_delete ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_delete ON public.lp_account_addresses
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

-- ============================================================
-- lp_account_contacts
-- ============================================================
DROP POLICY IF EXISTS lp_account_contacts_select ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_select ON public.lp_account_contacts
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_account_contacts_insert ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_insert ON public.lp_account_contacts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_contacts_update ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_update ON public.lp_account_contacts
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_contacts_delete ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_delete ON public.lp_account_contacts
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

-- ============================================================
-- lp_account_socials
-- ============================================================
DROP POLICY IF EXISTS lp_account_socials_select ON public.lp_account_socials;
CREATE POLICY lp_account_socials_select ON public.lp_account_socials
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_account_socials_insert ON public.lp_account_socials;
CREATE POLICY lp_account_socials_insert ON public.lp_account_socials
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_socials_update ON public.lp_account_socials;
CREATE POLICY lp_account_socials_update ON public.lp_account_socials
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_socials_delete ON public.lp_account_socials;
CREATE POLICY lp_account_socials_delete ON public.lp_account_socials
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

-- ============================================================
-- lp_account_images
-- ============================================================
DROP POLICY IF EXISTS lp_images_select ON public.lp_account_images;
CREATE POLICY lp_images_select ON public.lp_account_images
  FOR SELECT TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
  );

DROP POLICY IF EXISTS lp_images_insert ON public.lp_account_images;
CREATE POLICY lp_images_insert ON public.lp_account_images
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND uploaded_by_user_id = auth.uid()
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_images_update ON public.lp_account_images;
CREATE POLICY lp_images_update ON public.lp_account_images
  FOR UPDATE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND public.lp_can_delete_image(uploaded_by_user_id, id)
  )
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND uploaded_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_images_delete ON public.lp_account_images;
CREATE POLICY lp_images_delete ON public.lp_account_images
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND public.lp_account_access_enabled()
    AND public.lp_can_delete_image(uploaded_by_user_id, id)
  );

-- ============================================================
-- lp_image_usages
-- ============================================================
DROP POLICY IF EXISTS lp_usages_select ON public.lp_image_usages;
CREATE POLICY lp_usages_select ON public.lp_image_usages
  FOR SELECT TO authenticated
  USING (
    public.lp_account_access_enabled()
    AND EXISTS (
      SELECT 1 FROM public.lp_account_images i
      WHERE i.id = image_id AND public.lp_user_in_account(i.account_id)
    )
  );

DROP POLICY IF EXISTS lp_usages_insert ON public.lp_image_usages;
CREATE POLICY lp_usages_insert ON public.lp_image_usages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_account_access_enabled()
    AND EXISTS (
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
    public.lp_account_access_enabled()
    AND EXISTS (
      SELECT 1 FROM public.landing_pages lp
      WHERE lp.id = landing_page_id
        AND public.lp_user_in_account(lp.account_id)
        AND public.lp_can_edit_landing_page(lp.created_by_user_id)
    )
  );

-- ============================================================
-- Storage — galeria
-- ============================================================
DROP POLICY IF EXISTS gerador_lp_assets_insert_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_insert_gallery ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'gerador-lp-assets'
    AND public.lp_account_access_enabled()
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  );

DROP POLICY IF EXISTS gerador_lp_assets_update_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_update_gallery ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'gerador-lp-assets'
    AND public.lp_account_access_enabled()
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  )
  WITH CHECK (
    bucket_id = 'gerador-lp-assets'
    AND public.lp_account_access_enabled()
    AND name LIKE public.lp_gallery_storage_prefix() || '%'
  );

DROP POLICY IF EXISTS gerador_lp_assets_delete_gallery ON storage.objects;
CREATE POLICY gerador_lp_assets_delete_gallery ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'gerador-lp-assets'
    AND public.lp_account_access_enabled()
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
