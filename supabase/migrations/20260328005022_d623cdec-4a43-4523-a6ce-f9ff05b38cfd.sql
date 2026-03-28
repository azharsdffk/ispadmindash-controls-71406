
-- 1) is_admin() function using user_roles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- 2) user_security_logs table
CREATE TABLE IF NOT EXISTS public.user_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ip_address text,
  location text,
  country text,
  city text,
  device_info text,
  user_agent text,
  browser text,
  os text,
  login_method text,
  login_status text,
  event_type text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_security_logs_user_id ON public.user_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_created_at ON public.user_security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_security_logs_event_type ON public.user_security_logs(event_type);

-- 3) Enable RLS
ALTER TABLE public.user_security_logs ENABLE ROW LEVEL SECURITY;

-- 4) RLS: only admins can read user_security_logs
DROP POLICY IF EXISTS "Admins can read all user_security_logs" ON public.user_security_logs;
CREATE POLICY "Admins can read all user_security_logs"
ON public.user_security_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- 5) RLS on existing audit_logs: only admins can read
DROP POLICY IF EXISTS "Admins can read all audit_logs" ON public.audit_logs;
CREATE POLICY "Admins can read all audit_logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- 6) RLS on existing sensitive_operations_log: only admins
DROP POLICY IF EXISTS "Admins can read sensitive_operations_log" ON public.sensitive_operations_log;
CREATE POLICY "Admins can read sensitive_operations_log"
ON public.sensitive_operations_log FOR SELECT TO authenticated
USING (public.is_admin());

-- 7) RLS on login_attempts: only admins
DROP POLICY IF EXISTS "Admins can read login_attempts" ON public.login_attempts;
CREATE POLICY "Admins can read login_attempts"
ON public.login_attempts FOR SELECT TO authenticated
USING (public.is_admin());

-- 8) RLS on admin_pii_access_logs: only admins
DROP POLICY IF EXISTS "Admins can read admin_pii_access_logs" ON public.admin_pii_access_logs;
CREATE POLICY "Admins can read admin_pii_access_logs"
ON public.admin_pii_access_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- 9) RLS on employee_location_access_logs: only admins
DROP POLICY IF EXISTS "Admins can read employee_location_access_logs" ON public.employee_location_access_logs;
CREATE POLICY "Admins can read employee_location_access_logs"
ON public.employee_location_access_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- 10) RLS on security_audit_logs if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'security_audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can read security_audit_logs" ON public.security_audit_logs';
    EXECUTE 'CREATE POLICY "Admins can read security_audit_logs" ON public.security_audit_logs FOR SELECT TO authenticated USING (public.is_admin())';
  END IF;
END $$;

-- 11) Insert helper for security logs (service role / edge functions)
CREATE OR REPLACE FUNCTION public.insert_user_security_log(
  p_user_id uuid,
  p_ip_address text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_device_info text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_os text DEFAULT NULL,
  p_login_method text DEFAULT NULL,
  p_login_status text DEFAULT NULL,
  p_event_type text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  INSERT INTO public.user_security_logs (
    user_id, ip_address, location, country, city,
    device_info, user_agent, browser, os,
    login_method, login_status, event_type, metadata
  ) VALUES (
    p_user_id, p_ip_address, p_location, p_country, p_city,
    p_device_info, p_user_agent, p_browser, p_os,
    p_login_method, p_login_status, p_event_type,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$fn$;

-- 12) Revoke direct insert on security logs from authenticated
REVOKE INSERT ON public.user_security_logs FROM authenticated;
REVOKE INSERT ON public.user_security_logs FROM anon;
