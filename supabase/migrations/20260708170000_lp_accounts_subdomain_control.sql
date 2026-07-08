-- Migration: tabela canônica de contas LP + controle de subdomínio por conta.
-- Idempotente: seguro reexecutar.

CREATE TABLE IF NOT EXISTS public.lp_accounts (
  id bigint NOT NULL,
  name text NOT NULL DEFAULT ''::text,
  office_subdomain text,
  synced_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lp_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT lp_accounts_office_subdomain_format_ck CHECK (
    office_subdomain IS NULL
    OR office_subdomain ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$'
  ),
  CONSTRAINT lp_accounts_office_subdomain_no_backfill_prefix_ck CHECK (
    office_subdomain IS NULL OR office_subdomain !~ '^acct-'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS lp_accounts_office_subdomain_uk
  ON public.lp_accounts (office_subdomain)
  WHERE office_subdomain IS NOT NULL;

-- Backfill base: cria espelho das contas já presentes em landing_pages.
INSERT INTO public.lp_accounts (id, name, office_subdomain, synced_at)
SELECT DISTINCT
  lp.account_id,
  'Conta ' || lp.account_id::text,
  NULLIF(lp.office_subdomain, 'acct-' || lp.account_id::text),
  now()
FROM public.landing_pages lp
ON CONFLICT (id) DO NOTHING;

-- Backfill complementar: normaliza registros antigos `acct-{id}` em NULL.
UPDATE public.lp_accounts a
SET
  office_subdomain = NULL,
  updated_at = now()
WHERE a.office_subdomain = ('acct-' || a.id::text);

-- Trigger: propaga troca de subdomínio para landing_pages da mesma conta.
CREATE OR REPLACE FUNCTION public.lp_sync_office_subdomain_to_landing_pages()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.office_subdomain IS DISTINCT FROM OLD.office_subdomain THEN
    UPDATE public.landing_pages
    SET office_subdomain = NEW.office_subdomain
    WHERE account_id = NEW.id;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lp_accounts_sync_office_subdomain ON public.lp_accounts;
CREATE TRIGGER trg_lp_accounts_sync_office_subdomain
  BEFORE UPDATE ON public.lp_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.lp_sync_office_subdomain_to_landing_pages();

ALTER TABLE public.lp_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_accounts_select ON public.lp_accounts;
CREATE POLICY lp_accounts_select ON public.lp_accounts
  FOR SELECT TO authenticated
  USING (public.lp_user_in_account(id));

DROP POLICY IF EXISTS lp_accounts_insert ON public.lp_accounts;
CREATE POLICY lp_accounts_insert ON public.lp_accounts
  FOR INSERT TO authenticated
  WITH CHECK (
    public.lp_user_in_account(id)
    AND id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_accounts_update ON public.lp_accounts;
CREATE POLICY lp_accounts_update ON public.lp_accounts
  FOR UPDATE TO authenticated
  USING (public.lp_user_in_account(id))
  WITH CHECK (
    public.lp_user_in_account(id)
    AND id = public.lp_jwt_account_id()
    AND public.lp_is_account_owner()
  );

DROP POLICY IF EXISTS lp_accounts_delete ON public.lp_accounts;
CREATE POLICY lp_accounts_delete ON public.lp_accounts
  FOR DELETE TO authenticated
  USING (
    public.lp_user_in_account(id)
    AND (public.lp_is_account_owner() OR public.lp_is_super_admin())
  );

DROP POLICY IF EXISTS lp_accounts_super_admin ON public.lp_accounts;
CREATE POLICY lp_accounts_super_admin ON public.lp_accounts
  FOR ALL TO authenticated
  USING (public.lp_is_super_admin())
  WITH CHECK (public.lp_is_super_admin());
