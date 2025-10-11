-- ============================================
-- Phase 1: Fix Critical Role Issues
-- ============================================

-- Recreate handle_new_user function to ensure proper role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_count INTEGER;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO v_user_count FROM auth.users;
  
  -- Auto-assign admin role to the FIRST user only
  IF v_user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================
-- Phase 2: Protect Price Information
-- ============================================

-- Create public view for packages (without sensitive pricing info)
CREATE OR REPLACE VIEW public.public_packages AS
SELECT 
  id,
  name,
  name_en,
  description,
  speed_mbps,
  active
FROM public.packages
WHERE active = true;

-- Update RLS policies for packages table
DROP POLICY IF EXISTS "Authenticated users can view active packages" ON public.packages;
DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;

-- Only admins and accountants can see full package details including prices
CREATE POLICY "Admins and accountants can view packages"
ON public.packages
FOR SELECT
USING (
  has_role(auth.uid(), 'admin') OR 
  has_role(auth.uid(), 'accountant')
);

-- Admins can manage packages
CREATE POLICY "Admins can manage packages"
ON public.packages
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- Phase 3: Protect Technician Phone Numbers
-- ============================================

-- Create public view for technicians (without phone numbers)
CREATE OR REPLACE VIEW public.technicians_public AS
SELECT 
  id,
  name,
  specialization,
  available
FROM public.technicians
WHERE available = true;

-- Update RLS policies for technicians
DROP POLICY IF EXISTS "Users can view assigned technicians" ON public.technicians;

-- Only admins can see full technician details including phone
CREATE POLICY "Only admins can view full technician details"
ON public.technicians
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Technicians can view their own full data
CREATE POLICY "Technicians can view own data"
ON public.technicians
FOR SELECT
USING (id = auth.uid());

-- ============================================
-- Phase 4: Enhanced Password Reset Security
-- ============================================

-- Create function to check password reset rate limiting
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(p_identifier text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_attempts INTEGER;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current attempts for this identifier
  SELECT attempts, blocked_until
  INTO v_attempts, v_blocked_until
  FROM public.rate_limit_attempts
  WHERE identifier = p_identifier
    AND attempt_type = 'password_reset'
    AND last_attempt_at > NOW() - INTERVAL '1 hour';
  
  -- Check if blocked
  IF v_blocked_until IS NOT NULL AND v_blocked_until > NOW() THEN
    RETURN false;
  END IF;
  
  -- Check if too many attempts
  IF v_attempts >= 5 THEN
    -- Block for 1 hour
    INSERT INTO public.rate_limit_attempts (identifier, attempt_type, attempts, blocked_until)
    VALUES (p_identifier, 'password_reset', v_attempts + 1, NOW() + INTERVAL '1 hour')
    ON CONFLICT (identifier, attempt_type)
    DO UPDATE SET 
      attempts = rate_limit_attempts.attempts + 1,
      blocked_until = NOW() + INTERVAL '1 hour',
      last_attempt_at = NOW();
    
    RETURN false;
  END IF;
  
  -- Increment attempt counter
  INSERT INTO public.rate_limit_attempts (identifier, attempt_type, attempts)
  VALUES (p_identifier, 'password_reset', 1)
  ON CONFLICT (identifier, attempt_type)
  DO UPDATE SET 
    attempts = rate_limit_attempts.attempts + 1,
    last_attempt_at = NOW();
  
  RETURN true;
END;
$function$;

-- ============================================
-- Phase 5: Login Attempts Audit Trail
-- ============================================

-- Create login attempts table
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Admins can view all login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Prevent updates and deletes
CREATE POLICY "Prevent login attempts updates"
ON public.login_attempts
FOR UPDATE
USING (false);

CREATE POLICY "Prevent login attempts deletion"
ON public.login_attempts
FOR DELETE
USING (false);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at DESC);

-- ============================================
-- Phase 6: Improve subscriber_users Security
-- ============================================

-- Update RLS policies for subscriber_users
DROP POLICY IF EXISTS "Admins can manage subscriber links" ON public.subscriber_users;
DROP POLICY IF EXISTS "Clients can view their own subscriber link" ON public.subscriber_users;

-- Admins can manage all subscriber links
CREATE POLICY "Admins can manage subscriber links"
ON public.subscriber_users
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Users can only view their own subscriber link
CREATE POLICY "Users can view own subscriber link"
ON public.subscriber_users
FOR SELECT
USING (auth.uid() = user_id);

-- Prevent non-admin insertions
CREATE POLICY "Only admins can create subscriber links"
ON public.subscriber_users
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Prevent non-admin updates
CREATE POLICY "Only admins can update subscriber links"
ON public.subscriber_users
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Prevent non-admin deletions
CREATE POLICY "Only admins can delete subscriber links"
ON public.subscriber_users
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- Phase 7: Login Attempt Logging Function
-- ============================================

CREATE OR REPLACE FUNCTION public.log_login_attempt(
  p_email TEXT,
  p_user_id UUID,
  p_success BOOLEAN,
  p_ip_address INET,
  p_user_agent TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.login_attempts (
    user_id,
    email,
    success,
    ip_address,
    user_agent,
    error_message
  )
  VALUES (
    p_user_id,
    p_email,
    p_success,
    p_ip_address,
    p_user_agent,
    p_error_message
  );
END;
$function$;