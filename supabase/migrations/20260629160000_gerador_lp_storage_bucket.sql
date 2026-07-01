-- Migration: bucket Supabase Storage para mídias do Gerador LP.
-- Idempotente: seguro reexecutar.
--
-- Estrutura de pastas (path dentro do bucket):
--   {subdomain}.causi.adv.br/{lp-slug}/logo/logo.webp
--   {subdomain}.causi.adv.br/{lp-slug}/lawyers/{id}.webp
--   {subdomain}.causi.adv.br/{lp-slug}/sections/{hero|dor|sobre|solucao}.webp
--
-- Sem subdomínio vinculado em profiles:
--   _sem-subdominio/{causi_user_id}/{lp-slug}/...

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gerador-lp-assets',
  'gerador-lp-assets',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS gerador_lp_assets_public_read ON storage.objects;

CREATE POLICY gerador_lp_assets_public_read
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'gerador-lp-assets');
