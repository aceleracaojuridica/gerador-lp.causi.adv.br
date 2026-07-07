-- Migration: remover custom_domain de lp_account_settings
-- Criar tabelas lp_account_addresses, lp_account_contacts, lp_account_socials
-- e triggers para gerenciamento do flag is_primary.

-- 1. Remover custom_domain de lp_account_settings
ALTER TABLE public.lp_account_settings DROP COLUMN IF EXISTS custom_domain;

-- 2. Criar tabela lp_account_addresses
CREATE TABLE IF NOT EXISTS public.lp_account_addresses (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id   bigint      NOT NULL,
  address      text        NOT NULL,
  cidade       text        NOT NULL,
  uf           text        NOT NULL,
  maps_url     text,
  is_primary   boolean     DEFAULT false NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index para performance nas buscas por conta
CREATE INDEX IF NOT EXISTS idx_lp_account_addresses_account ON public.lp_account_addresses (account_id);

-- RLS
ALTER TABLE public.lp_account_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_account_addresses_select ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_select ON public.lp_account_addresses
  FOR SELECT TO authenticated USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS lp_account_addresses_insert ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_insert ON public.lp_account_addresses
  FOR INSERT TO authenticated WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_addresses_update ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_update ON public.lp_account_addresses
  FOR UPDATE TO authenticated USING (public.lp_user_in_account(account_id))
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_addresses_delete ON public.lp_account_addresses;
CREATE POLICY lp_account_addresses_delete ON public.lp_account_addresses
  FOR DELETE TO authenticated USING (public.lp_user_in_account(account_id));

-- Trigger para is_primary de endereços
CREATE OR REPLACE FUNCTION public.handle_lp_account_address_primary()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for o único endereço da conta, ou se não houver outro primário, força este a ser primário
  IF NOT EXISTS (
    SELECT 1 FROM public.lp_account_addresses 
    WHERE account_id = NEW.account_id AND id IS DISTINCT FROM NEW.id AND is_primary = true
  ) THEN
    NEW.is_primary := true;
  END IF;

  -- Se o novo registro for primário, define os outros como não-primários
  IF NEW.is_primary = true THEN
    UPDATE public.lp_account_addresses
    SET is_primary = false, updated_at = now()
    WHERE account_id = NEW.account_id AND id IS DISTINCT FROM NEW.id AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_address_primary_trigger ON public.lp_account_addresses;
CREATE TRIGGER lp_account_address_primary_trigger
BEFORE INSERT OR UPDATE OF is_primary, account_id ON public.lp_account_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_address_primary();

CREATE OR REPLACE FUNCTION public.handle_lp_account_address_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_primary = true THEN
    -- Promove o endereço mais antigo restante a primário
    UPDATE public.lp_account_addresses
    SET is_primary = true, updated_at = now()
    WHERE id = (
      SELECT id FROM public.lp_account_addresses
      WHERE account_id = OLD.account_id
      ORDER BY created_at ASC
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_address_delete_trigger ON public.lp_account_addresses;
CREATE TRIGGER lp_account_address_delete_trigger
AFTER DELETE ON public.lp_account_addresses
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_address_delete();


-- 3. Criar tabela lp_account_contacts
CREATE TABLE IF NOT EXISTS public.lp_account_contacts (
  id               bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id       bigint      NOT NULL,
  whatsapp         text        NOT NULL,
  whatsapp_display text        NOT NULL,
  email            text        NOT NULL,
  is_primary       boolean     DEFAULT false NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_account_contacts_account ON public.lp_account_contacts (account_id);

ALTER TABLE public.lp_account_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_account_contacts_select ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_select ON public.lp_account_contacts
  FOR SELECT TO authenticated USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS lp_account_contacts_insert ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_insert ON public.lp_account_contacts
  FOR INSERT TO authenticated WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_contacts_update ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_update ON public.lp_account_contacts
  FOR UPDATE TO authenticated USING (public.lp_user_in_account(account_id))
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_contacts_delete ON public.lp_account_contacts;
CREATE POLICY lp_account_contacts_delete ON public.lp_account_contacts
  FOR DELETE TO authenticated USING (public.lp_user_in_account(account_id));

-- Trigger para is_primary de contatos
CREATE OR REPLACE FUNCTION public.handle_lp_account_contact_primary()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.lp_account_contacts 
    WHERE account_id = NEW.account_id AND id IS DISTINCT FROM NEW.id AND is_primary = true
  ) THEN
    NEW.is_primary := true;
  END IF;

  IF NEW.is_primary = true THEN
    UPDATE public.lp_account_contacts
    SET is_primary = false, updated_at = now()
    WHERE account_id = NEW.account_id AND id IS DISTINCT FROM NEW.id AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_contact_primary_trigger ON public.lp_account_contacts;
CREATE TRIGGER lp_account_contact_primary_trigger
BEFORE INSERT OR UPDATE OF is_primary, account_id ON public.lp_account_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_contact_primary();

CREATE OR REPLACE FUNCTION public.handle_lp_account_contact_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_primary = true THEN
    UPDATE public.lp_account_contacts
    SET is_primary = true, updated_at = now()
    WHERE id = (
      SELECT id FROM public.lp_account_contacts
      WHERE account_id = OLD.account_id
      ORDER BY created_at ASC
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_contact_delete_trigger ON public.lp_account_contacts;
CREATE TRIGGER lp_account_contact_delete_trigger
AFTER DELETE ON public.lp_account_contacts
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_contact_delete();


-- 4. Criar tabela lp_account_socials
CREATE TABLE IF NOT EXISTS public.lp_account_socials (
  id           bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  account_id   bigint      NOT NULL,
  network      text        NOT NULL,
  url          text        NOT NULL,
  is_primary   boolean     DEFAULT false NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lp_account_socials_account ON public.lp_account_socials (account_id);

ALTER TABLE public.lp_account_socials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lp_account_socials_select ON public.lp_account_socials;
CREATE POLICY lp_account_socials_select ON public.lp_account_socials
  FOR SELECT TO authenticated USING (public.lp_user_in_account(account_id));

DROP POLICY IF EXISTS lp_account_socials_insert ON public.lp_account_socials;
CREATE POLICY lp_account_socials_insert ON public.lp_account_socials
  FOR INSERT TO authenticated WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_socials_update ON public.lp_account_socials;
CREATE POLICY lp_account_socials_update ON public.lp_account_socials
  FOR UPDATE TO authenticated USING (public.lp_user_in_account(account_id))
  WITH CHECK (
    public.lp_user_in_account(account_id)
    AND account_id = public.lp_jwt_account_id()
  );

DROP POLICY IF EXISTS lp_account_socials_delete ON public.lp_account_socials;
CREATE POLICY lp_account_socials_delete ON public.lp_account_socials
  FOR DELETE TO authenticated USING (public.lp_user_in_account(account_id));

-- Trigger para is_primary de redes sociais (1 de cada tipo)
CREATE OR REPLACE FUNCTION public.handle_lp_account_social_primary()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.lp_account_socials 
    WHERE account_id = NEW.account_id AND network = NEW.network AND id IS DISTINCT FROM NEW.id AND is_primary = true
  ) THEN
    NEW.is_primary := true;
  END IF;

  IF NEW.is_primary = true THEN
    UPDATE public.lp_account_socials
    SET is_primary = false, updated_at = now()
    WHERE account_id = NEW.account_id AND network = NEW.network AND id IS DISTINCT FROM NEW.id AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_social_primary_trigger ON public.lp_account_socials;
CREATE TRIGGER lp_account_social_primary_trigger
BEFORE INSERT OR UPDATE OF is_primary, account_id, network ON public.lp_account_socials
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_social_primary();

CREATE OR REPLACE FUNCTION public.handle_lp_account_social_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_primary = true THEN
    UPDATE public.lp_account_socials
    SET is_primary = true, updated_at = now()
    WHERE id = (
      SELECT id FROM public.lp_account_socials
      WHERE account_id = OLD.account_id AND network = OLD.network
      ORDER BY created_at ASC
      LIMIT 1
    );
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lp_account_social_delete_trigger ON public.lp_account_socials;
CREATE TRIGGER lp_account_social_delete_trigger
AFTER DELETE ON public.lp_account_socials
FOR EACH ROW EXECUTE FUNCTION public.handle_lp_account_social_delete();
