-- Migration: configurações globais de LP por conta (tracking, snippets,
-- tipografia, domínio e captcha público).
-- Idempotente: seguro reexecutar.

DROP TABLE IF EXISTS public.user_settings;

CREATE TABLE IF NOT EXISTS public.lp_account_settings (
  account_id           bigint      NOT NULL,
  updated_by_user_id   uuid        NOT NULL,
  heading_font         text        NOT NULL DEFAULT ''::text,
  body_font            text        NOT NULL DEFAULT ''::text,
  tracking_providers   jsonb       NOT NULL DEFAULT '{"ga4MeasurementId":"","gtmContainerId":"","metaPixelId":"","googleAdsId":"","googleAdsLabel":""}'::jsonb,
  tracking_scripts     jsonb       NOT NULL DEFAULT '{"body":"","head":"","footer":""}'::jsonb,
  captcha_config       jsonb       NOT NULL DEFAULT '{"provider":"none","siteKey":"","widgetTheme":"auto"}'::jsonb,
  custom_domain        text        NOT NULL DEFAULT ''::text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lp_account_settings_pkey PRIMARY KEY (account_id)
);

CREATE INDEX IF NOT EXISTS idx_lp_account_settings_updated_by
  ON public.lp_account_settings (updated_by_user_id);

ALTER TABLE public.lp_account_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_account_settings_select ON public.lp_account_settings;
CREATE POLICY lp_account_settings_select ON public.lp_account_settings
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS lp_account_settings_insert ON public.lp_account_settings;
CREATE POLICY lp_account_settings_insert ON public.lp_account_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
    AND updated_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_account_settings_update ON public.lp_account_settings;
CREATE POLICY lp_account_settings_update ON public.lp_account_settings
  FOR UPDATE TO authenticated
  USING (public.lp_user_in_account(account_id))
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
    AND updated_by_user_id = auth.uid()
  );

DROP POLICY IF EXISTS lp_account_settings_delete ON public.lp_account_settings;
CREATE POLICY lp_account_settings_delete ON public.lp_account_settings
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(account_id)
    AND (public.lp_is_account_owner() OR public.lp_is_super_admin())
  );

DROP POLICY IF EXISTS lp_account_settings_super_admin ON public.lp_account_settings;
CREATE POLICY lp_account_settings_super_admin ON public.lp_account_settings
  FOR ALL TO authenticated
  USING (public.lp_is_super_admin())
  WITH CHECK (public.lp_is_super_admin());
