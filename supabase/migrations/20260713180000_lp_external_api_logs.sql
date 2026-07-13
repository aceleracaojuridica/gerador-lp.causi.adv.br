-- Auditoria de chamadas a APIs externas (OpenAI, Unsplash, etc.).
-- Útil para debugar request/response no dashboard do Supabase.
-- Acesso restrito a service_role via RLS. Registros > 3 meses são removidos automaticamente.

CREATE TABLE IF NOT EXISTS public.lp_external_api_logs (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id           bigint,
  created_by_user_id   uuid,
  landing_page_id      uuid REFERENCES public.landing_pages (id) ON DELETE SET NULL,

  provider             text NOT NULL,
  operation            text NOT NULL,
  action               text NOT NULL,
  context              text NOT NULL,

  request_payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  response_payload     jsonb,
  status_code          integer,
  duration_ms          integer,
  ok                   boolean NOT NULL DEFAULT false,
  error                text,

  created_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

COMMENT ON TABLE public.lp_external_api_logs IS
  'Auditoria de chamadas a APIs externas. Acesso via service_role. Registros > 3 meses removidos automaticamente.';
COMMENT ON COLUMN public.lp_external_api_logs.provider IS
  'Provedor externo: openai | unsplash | …';
COMMENT ON COLUMN public.lp_external_api_logs.operation IS
  'Operação técnica: chat.completions | unsplash.random | unsplash.search | …';
COMMENT ON COLUMN public.lp_external_api_logs.action IS
  'Ação de negócio: CREATE | UPDATE | READ | …';
COMMENT ON COLUMN public.lp_external_api_logs.context IS
  'Onde na app: create_landing_page | edit_landing_page | gallery | improve_text | suggest_palette | …';
COMMENT ON COLUMN public.lp_external_api_logs.request_payload IS
  'Payload enviado ao provedor (sanitizado — sem base64/API keys).';
COMMENT ON COLUMN public.lp_external_api_logs.response_payload IS
  'Payload recebido do provedor (sanitizado).';
COMMENT ON COLUMN public.lp_external_api_logs.deleted_at IS
  'Soft-delete manual. O trigger de limpeza remove deleted_at IS NOT NULL ou created_at > 3 meses.';

CREATE INDEX IF NOT EXISTS idx_lp_external_api_logs_created_at
  ON public.lp_external_api_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_external_api_logs_provider_op
  ON public.lp_external_api_logs (provider, operation);
CREATE INDEX IF NOT EXISTS idx_lp_external_api_logs_context_action
  ON public.lp_external_api_logs (context, action);
CREATE INDEX IF NOT EXISTS idx_lp_external_api_logs_account
  ON public.lp_external_api_logs (account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lp_external_api_logs_failed
  ON public.lp_external_api_logs (created_at DESC)
  WHERE ok = false;

ALTER TABLE public.lp_external_api_logs ENABLE ROW LEVEL SECURITY;

-- Sem policies para authenticated/anon → apenas service_role acessa.

CREATE OR REPLACE FUNCTION public.cleanup_old_lp_external_api_logs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF random() < 0.01 THEN
    DELETE FROM public.lp_external_api_logs
    WHERE created_at < now() - INTERVAL '3 months'
       OR deleted_at IS NOT NULL;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_old_lp_external_api_logs
  ON public.lp_external_api_logs;

CREATE TRIGGER trg_cleanup_old_lp_external_api_logs
  AFTER INSERT ON public.lp_external_api_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.cleanup_old_lp_external_api_logs();
