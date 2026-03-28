
-- ============================================================
-- FIX 1: Remove admin SELECT on user_security_settings 
--         (prevents admins from reading two_factor_secret)
-- ============================================================

-- Drop the admin policy that exposes two_factor_secret
DROP POLICY IF EXISTS "Admins can view all security settings" ON public.user_security_settings;

-- Create a safe admin view that excludes sensitive columns
CREATE OR REPLACE VIEW public.user_security_settings_admin AS
SELECT
  id,
  user_id,
  allow_multiple_sessions,
  two_factor_enabled,
  -- deliberately excludes two_factor_secret
  updated_at,
  created_at
FROM public.user_security_settings;

-- ============================================================
-- FIX 2: Secure phone_otps - remove admin access, add hash
--         column, create secure verify function
-- ============================================================

-- Drop admin policy on phone_otps
DROP POLICY IF EXISTS "Admins can manage OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Admins can view all OTPs" ON public.phone_otps;
DROP POLICY IF EXISTS "Admins can delete expired OTPs" ON public.phone_otps;

-- Add otp_hash column for future hashed storage
ALTER TABLE public.phone_otps ADD COLUMN IF NOT EXISTS otp_hash TEXT;

-- Create secure verify function that never exposes raw OTP
CREATE OR REPLACE FUNCTION public.verify_phone_otp(p_phone text, p_code text)
RETURNS TABLE(
  is_valid boolean,
  otp_id uuid,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_hash TEXT;
BEGIN
  -- Compute hash of provided code
  v_hash := encode(sha256(p_code::bytea), 'hex');

  -- Try hash-based lookup first
  SELECT po.id, po.otp_hash, po.otp_code
  INTO v_record
  FROM public.phone_otps po
  WHERE po.phone = p_phone
    AND po.verified = false
    AND po.expires_at > now()
  ORDER BY po.created_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'الرمز غير صالح أو منتهي الصلاحية'::text;
    RETURN;
  END IF;

  -- Check hash first, then fall back to plaintext for migration period
  IF (v_record.otp_hash IS NOT NULL AND v_record.otp_hash = v_hash)
     OR (v_record.otp_hash IS NULL AND v_record.otp_code = p_code) THEN
    -- Mark as verified
    UPDATE public.phone_otps SET verified = true WHERE id = v_record.id;
    RETURN QUERY SELECT true, v_record.id, NULL::text;
  ELSE
    RETURN QUERY SELECT false, NULL::uuid, 'الرمز غير صحيح'::text;
  END IF;
END;
$$;

-- Create secure function to store OTP (hashed)
CREATE OR REPLACE FUNCTION public.store_phone_otp(p_phone text, p_otp_code text, p_expires_minutes integer DEFAULT 10)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.phone_otps (phone, otp_code, otp_hash, expires_at)
  VALUES (
    p_phone,
    '******',  -- never store plaintext
    encode(sha256(p_otp_code::bytea), 'hex'),
    now() + (p_expires_minutes || ' minutes')::interval
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
