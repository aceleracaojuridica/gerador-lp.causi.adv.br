-- Migration: migra dados de lps / leads_gerador → profiles.pages / leads
-- e remove tabelas legadas do gerador (convivência com Lovable preservada).
-- Idempotente: seguro reexecutar; pula se tabelas legadas já foram removidas.

-- ============================================================
-- 1. lps → profiles.pages
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'lps'
  ) THEN
    RAISE NOTICE 'public.lps não existe — etapa 1 ignorada.';
    RETURN;
  END IF;

  -- Perfis existentes: acrescenta páginas de lps que ainda não estão em pages (por slug)
  UPDATE public.profiles p
  SET pages = (
    SELECT COALESCE(jsonb_agg(combined.page ORDER BY combined.ord), '[]'::jsonb)
    FROM (
      SELECT 0 AS ord, elem AS page
      FROM jsonb_array_elements(COALESCE(p.pages, '[]'::jsonb)) AS elem
      UNION ALL
      SELECT
        1,
        jsonb_build_object(
          'slug', l.slug,
          'name', l.name,
          'tema', l.tema,
          'schema', l.schema
        )
      FROM public.lps l
      WHERE l.causi_user_id::uuid = p.id
        AND NOT EXISTS (
          SELECT 1
          FROM jsonb_array_elements(COALESCE(p.pages, '[]'::jsonb)) AS existing
          WHERE existing->>'slug' = l.slug
        )
    ) AS combined
  )
  WHERE EXISTS (
    SELECT 1 FROM public.lps l WHERE l.causi_user_id::uuid = p.id
  );

  -- Usuários só em lps: cria profile (exige auth.users no Projeto B)
  INSERT INTO public.profiles (id, subdomain, pages)
  SELECT
    l.causi_user_id::uuid,
    COALESCE(
      (
        SELECT NULLIF(l2.client_slug, '')
        FROM public.lps l2
        WHERE l2.causi_user_id = l.causi_user_id
          AND NULLIF(l2.client_slug, '') IS NOT NULL
        ORDER BY l2.updated_at DESC
        LIMIT 1
      ),
      (
        SELECT l2.slug
        FROM public.lps l2
        WHERE l2.causi_user_id = l.causi_user_id
        ORDER BY l2.updated_at DESC
        LIMIT 1
      )
    ),
    jsonb_agg(
      jsonb_build_object(
        'slug', l.slug,
        'name', l.name,
        'tema', l.tema,
        'schema', l.schema
      )
      ORDER BY l.updated_at DESC
    )
  FROM public.lps l
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = l.causi_user_id::uuid
  )
    AND EXISTS (
      SELECT 1 FROM auth.users u WHERE u.id = l.causi_user_id::uuid
    )
  GROUP BY l.causi_user_id
  ON CONFLICT (id) DO UPDATE
    SET pages = EXCLUDED.pages
    WHERE public.profiles.pages = '[]'::jsonb
       OR public.profiles.pages IS NULL;

  RAISE NOTICE 'Migração lps → profiles.pages concluída.';
END $$;

-- ============================================================
-- 2. leads_gerador → leads (formato Lovable: nome, telefone, subdomain)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'leads_gerador'
  ) THEN
    RAISE NOTICE 'public.leads_gerador não existe — etapa 2 ignorada.';
    RETURN;
  END IF;

  INSERT INTO public.leads (created_at, nome, telefone, page_url, subdomain)
  SELECT
    lg.created_at,
    lg.name,
    lg.phone,
    lg.page_url,
    COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain)
  FROM public.leads_gerador lg
  LEFT JOIN public.profiles pr ON pr.id = lg.causi_user_id::uuid
  WHERE COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain) IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.leads existing
      WHERE existing.created_at IS NOT DISTINCT FROM lg.created_at
        AND existing.nome IS NOT DISTINCT FROM lg.name
        AND existing.telefone IS NOT DISTINCT FROM lg.phone
        AND existing.subdomain IS NOT DISTINCT FROM COALESCE(NULLIF(lg.client_slug, ''), pr.subdomain)
        AND existing.page_url IS NOT DISTINCT FROM lg.page_url
    );

  RAISE NOTICE 'Migração leads_gerador → leads concluída.';
END $$;

-- ============================================================
-- 3. Remover tabelas legadas (após migração de dados)
-- ============================================================
DROP TRIGGER IF EXISTS trg_lps_ensure_user ON public.lps;
DROP TRIGGER IF EXISTS trg_lps_updated_at ON public.lps;

DROP TABLE IF EXISTS public.leads_gerador;
DROP TABLE IF EXISTS public.lps;
