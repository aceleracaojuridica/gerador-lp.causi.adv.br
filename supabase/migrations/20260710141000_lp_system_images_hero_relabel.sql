-- Migration: diferencia label/semantic_tags das 3 imagens de hero do
-- catálogo de sistema — hoje idênticas ("Imagem do sistema" + as mesmas
-- 5 tags), o que torna a escolha da IA arbitrária (candidatos indistinguíveis).
-- Idempotente: segura para ambientes já provisionados.

UPDATE public.lp_system_images
SET
  label = 'Fachada moderna com vidro verde, luz de dia',
  semantic_tags = '["fachada", "predio corporativo", "vidro verde", "diurno", "exterior", "arquitetura contemporanea"]'::jsonb
WHERE storage_path = 'system/defaults/hero/predio-verde.webp';

UPDATE public.lp_system_images
SET
  label = 'Prédios corporativos em preto e branco',
  semantic_tags = '["fachada", "predios", "preto e branco", "exterior", "sofisticado", "premium"]'::jsonb
WHERE storage_path = 'system/defaults/hero/predios-imagem-escura.webp';

UPDATE public.lp_system_images
SET
  label = 'Interior de escritório moderno',
  semantic_tags = '["interior", "escritorio", "sala de reuniao", "ambiente profissional", "clean", "luminoso"]'::jsonb
WHERE storage_path = 'system/defaults/hero/office.webp';
