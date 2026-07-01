-- Removes template_id from landing_pages (concept no longer exists in the app).
-- Safe to re-run: DROP COLUMN IF EXISTS is idempotent.
ALTER TABLE public.landing_pages DROP COLUMN IF EXISTS template_id;
