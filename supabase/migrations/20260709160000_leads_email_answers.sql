-- Estende public.leads com respostas customizadas do popup (jsonb).

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS answers jsonb NOT NULL DEFAULT '{}'::jsonb;
