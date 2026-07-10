-- Migration: tags de seção para imagens da galeria da conta.
-- Idempotente: segura para ambientes já provisionados.
--
-- Problema: lp_account_images não tinha nenhum sinal de "para qual seção
-- essa foto serve", então a geração de LP distribuía as fotos da galeria
-- por posição (índice), ignorando o catálogo de sistema (lp_system_images)
-- mesmo quando ele tinha imagens melhores para a seção.
--
-- section_tags é preenchido/atualizado automaticamente por
-- syncImageUsagesFromSchema() (src/lib/landing-pages/image-usages.ts) toda
-- vez que uma LP é salva: cada imagem ganha a(s) seção(ões) em que já foi
-- efetivamente usada (ex: ["hero"], depois ["hero","sobre"] se reaproveitada).

ALTER TABLE public.lp_account_images
  ADD COLUMN IF NOT EXISTS section_tags jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_lp_account_images_section_tags
  ON public.lp_account_images USING GIN (section_tags);

-- Backfill: deriva section_tags das seções em que a imagem já foi usada,
-- a partir do histórico já registrado em lp_image_usages (slot no formato
-- "sections.<hero|dor|sobre|solucao>").
UPDATE public.lp_account_images a
SET section_tags = COALESCE(
  (
    SELECT jsonb_agg(DISTINCT substring(u.slot from 'sections\.(.+)'))
    FROM public.lp_image_usages u
    WHERE u.image_id = a.id
      AND u.slot LIKE 'sections.%'
  ),
  '[]'::jsonb
)
WHERE jsonb_array_length(section_tags) = 0;
