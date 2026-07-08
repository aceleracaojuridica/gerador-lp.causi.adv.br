-- Migration: metadados semânticos para ranking de imagens do sistema.
-- Idempotente: segura para ambientes já provisionados.

ALTER TABLE public.lp_system_images
  ADD COLUMN IF NOT EXISTS semantic_tags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lp_system_images_semantic_tags
  ON public.lp_system_images USING GIN (semantic_tags);

-- Tags semânticas mínimas para melhorar ranking por IA e fallback local.
-- Atualiza apenas registros ainda sem tags.
UPDATE public.lp_system_images
SET semantic_tags = CASE
  WHEN storage_path LIKE 'system/defaults/hero/%' THEN
    '["hero","escritorio","advocacia","fachada","moderno"]'::jsonb
  WHEN storage_path LIKE 'system/defaults/dor/%' THEN
    '["dor","preocupacao","documentos","cliente","atendimento"]'::jsonb
  WHEN storage_path LIKE 'system/defaults/sobre/%' THEN
    '["sobre","escritorio","institucional","ambiente-profissional"]'::jsonb
  WHEN storage_path LIKE 'system/defaults/solucao/%' THEN
    '["solucao","consulta","advogado","orientacao","cliente"]'::jsonb
  ELSE '[]'::jsonb
END
WHERE jsonb_array_length(semantic_tags) = 0;
