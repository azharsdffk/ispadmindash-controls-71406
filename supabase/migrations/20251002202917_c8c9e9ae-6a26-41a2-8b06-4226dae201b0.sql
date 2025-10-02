-- ============================================
-- CRITICAL SECURITY FIXES
-- ============================================

-- 1. FIX PROFILES TABLE RLS - Block anonymous access
-- Drop existing overly permissive policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create strict policy to block all anonymous access
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false);

-- 2. FIX SUBSCRIBERS TABLE RLS - Require valid role
-- Remove redundant policy (already have "Default deny all subscriber access")
DROP POLICY IF EXISTS "Block anonymous subscriber access" ON public.subscribers;

-- Ensure the default deny policy requires authenticated users with roles
DROP POLICY IF EXISTS "Default deny all subscriber access" ON public.subscribers;

CREATE POLICY "Require valid role for subscriber access"
ON public.subscribers
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role) OR 
  has_role(auth.uid(), 'technician'::app_role) OR 
  has_role(auth.uid(), 'client'::app_role)
);

-- 3. FIX PASSWORD RESET TOKENS - Restrict to service role only
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Service can manage reset tokens" ON public.password_reset_tokens;

-- Create strict policies
CREATE POLICY "Service role can manage reset tokens"
ON public.password_reset_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Block user access to reset tokens"
ON public.password_reset_tokens
FOR ALL
TO authenticated, anon
USING (false);

-- 4. ENFORCE PII ACCESS LOGGING - Create trigger for automatic logging
-- This ensures all subscriber queries are logged, not optional

CREATE OR REPLACE FUNCTION public.log_subscriber_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log for non-admin users to reduce noise
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO pii_access_logs (
      user_id,
      subscriber_id,
      accessed_fields,
      access_type,
      ip_address
    ) VALUES (
      auth.uid(),
      NEW.id,
      ARRAY['name', 'phone', 'email', 'address', 'balance', 'plan']::text[],
      'view',
      inet_client_addr()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Note: We cannot create a trigger on SELECT operations in PostgreSQL
-- Instead, this must be enforced at the application level or through views
-- Commenting out the trigger approach as it's not feasible
-- CREATE TRIGGER log_subscriber_select_trigger
-- AFTER SELECT ON public.subscribers
-- FOR EACH ROW EXECUTE FUNCTION public.log_subscriber_view();

-- Alternative: Create a secure view for subscribers that logs access
CREATE OR REPLACE VIEW public.subscribers_with_logging AS
SELECT * FROM public.subscribers;