
-- Fix: make the admin view use security_invoker instead of default security_definer
DROP VIEW IF EXISTS public.user_security_settings_admin;
CREATE VIEW public.user_security_settings_admin WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  allow_multiple_sessions,
  two_factor_enabled,
  updated_at,
  created_at
FROM public.user_security_settings;
