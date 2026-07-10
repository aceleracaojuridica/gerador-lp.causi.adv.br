-- Remove captcha por conta (Turnstile agora é global via .env)
ALTER TABLE lp_account_settings
  DROP COLUMN IF EXISTS captcha_config;

-- Novo default do shape de tracking com toggles por provedor
ALTER TABLE lp_account_settings
  ALTER COLUMN tracking_providers
  SET DEFAULT '{
    "ga4": { "enabled": false, "measurementId": "" },
    "gtm": { "enabled": false, "containerId": "" },
    "metaPixel": { "enabled": false, "pixelId": "" },
    "googleAds": { "enabled": false, "adsId": "", "conversionLabel": "" }
  }'::jsonb;
