-- Fix: lp_account_access_enabled() lia lp_accounts dentro de políticas RLS da mesma
-- tabela, causando recursão infinita (PostgreSQL 54001 stack depth limit exceeded).
-- Leitura permanece liberada para membros da conta; entitlement bloqueia só mutações.

CREATE OR REPLACE FUNCTION public.lp_account_access_enabled()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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

-- landing_pages
DROP POLICY IF EXISTS landing_pages_select_account ON public.landing_pages;
CREATE POLICY landing_pages_select_account ON public.landing_pages
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_accounts
DROP POLICY IF EXISTS lp_accounts_select ON public.lp_accounts;
CREATE POLICY lp_accounts_select ON public.lp_accounts
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(id));

-- lp_account_settings
DROP POLICY IF EXISTS lp_account_settings_select ON public.lp_account_settings;
CREATE POLICY lp_account_settings_select ON public.lp_account_settings
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_account_addresses
DROP POLICY IF EXISTS lp_account_addresses_select ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_select ON public.lp_account_addresses
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_account_contacts
DROP POLICY IF EXISTS lp_account_contacts_select ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_select ON public.lp_account_contacts
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_account_socials
DROP POLICY IF EXISTS lp_account_socials_select ON public.lp_account_socials;
CREATE POLICY lp_account_socials_select ON public.lp_account_socials
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_account_images
DROP POLICY IF EXISTS lp_images_select ON public.lp_account_images;
CREATE POLICY lp_images_select ON public.lp_account_images
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

-- lp_image_usages
DROP POLICY IF EXISTS lp_usages_select ON public.lp_image_usages;
CREATE POLICY lp_usages_select ON public.lp_image_usages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lp_account_images i
      WHERE i.id = image_id AND public.lp_user_in_account(i.account_id)
    )
  );
