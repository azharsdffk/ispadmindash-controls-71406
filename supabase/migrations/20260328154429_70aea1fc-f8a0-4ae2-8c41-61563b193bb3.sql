
-- Table to store admin PINs (hashed)
CREATE TABLE public.admin_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.admin_pins ENABLE ROW LEVEL SECURITY;

-- Only the user themselves can read their own record
CREATE POLICY "Users can view own pin record"
ON public.admin_pins FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Secure function to set/update PIN
CREATE OR REPLACE FUNCTION public.set_admin_pin(p_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Must be admin or super_admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  -- PIN must be exactly 4 digits
  IF p_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'PIN must be exactly 4 digits';
  END IF;

  INSERT INTO public.admin_pins (user_id, pin_hash, failed_attempts)
  VALUES (auth.uid(), encode(sha256(p_pin::bytea), 'hex'), 0)
  ON CONFLICT (user_id) DO UPDATE SET
    pin_hash = encode(sha256(p_pin::bytea), 'hex'),
    failed_attempts = 0,
    blocked_until = NULL,
    updated_at = now();

  RETURN true;
END;
$$;

-- Secure function to verify PIN
CREATE OR REPLACE FUNCTION public.verify_admin_pin(p_pin TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_record RECORD;
  v_hash TEXT;
BEGIN
  -- Must be admin
  IF NOT public.is_admin() THEN
    RETURN QUERY SELECT false, 'غير مصرح'::TEXT;
    RETURN;
  END IF;

  -- Check if PIN exists for user
  SELECT * INTO v_record
  FROM public.admin_pins
  WHERE user_id = auth.uid();

  IF v_record IS NULL THEN
    RETURN QUERY SELECT false, 'no_pin'::TEXT;
    RETURN;
  END IF;

  -- Check if blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > now() THEN
    RETURN QUERY SELECT false, 'محظور مؤقتاً، حاول لاحقاً'::TEXT;
    RETURN;
  END IF;

  v_hash := encode(sha256(p_pin::bytea), 'hex');

  IF v_record.pin_hash = v_hash THEN
    -- Reset failed attempts on success
    UPDATE public.admin_pins
    SET failed_attempts = 0, blocked_until = NULL, updated_at = now()
    WHERE user_id = auth.uid();

    RETURN QUERY SELECT true, 'تم التحقق بنجاح'::TEXT;
  ELSE
    -- Increment failed attempts
    UPDATE public.admin_pins
    SET failed_attempts = v_record.failed_attempts + 1,
        blocked_until = CASE
          WHEN v_record.failed_attempts + 1 >= 5 THEN now() + INTERVAL '15 minutes'
          ELSE NULL
        END,
        updated_at = now()
    WHERE user_id = auth.uid();

    RETURN QUERY SELECT false,
      CASE
        WHEN v_record.failed_attempts + 1 >= 5 THEN 'تم الحظر لمدة 15 دقيقة'
        ELSE 'رمز PIN غير صحيح (' || (5 - v_record.failed_attempts - 1)::TEXT || ' محاولات متبقية)'
      END::TEXT;
  END IF;
END;
$$;
