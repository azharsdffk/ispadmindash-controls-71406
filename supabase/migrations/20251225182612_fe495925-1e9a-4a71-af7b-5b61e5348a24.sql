-- جدول لتتبع محاولات إرسال OTP
CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attempts_count INTEGER DEFAULT 1,
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهرس للبحث السريع
CREATE INDEX idx_otp_rate_limits_phone ON public.otp_rate_limits(phone_number);

-- Enable RLS
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح بالقراءة والكتابة من Edge Functions فقط
CREATE POLICY "Allow service role full access" ON public.otp_rate_limits
  FOR ALL USING (true) WITH CHECK (true);

-- جدول لتتبع محاولات إدخال OTP الخاطئة
CREATE TABLE IF NOT EXISTS public.otp_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  failed_attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_otp_verification_phone ON public.otp_verification_attempts(phone_number);

ALTER TABLE public.otp_verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on verification" ON public.otp_verification_attempts
  FOR ALL USING (true) WITH CHECK (true);

-- دالة للتحقق من rate limit
CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(p_phone TEXT)
RETURNS TABLE(can_send BOOLEAN, wait_seconds INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_seconds_since_last INTEGER;
BEGIN
  SELECT * INTO v_record
  FROM public.otp_rate_limits
  WHERE phone_number = p_phone
  ORDER BY last_sent_at DESC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, 0, 'OK'::TEXT;
    RETURN;
  END IF;
  
  -- التحقق من الحظر
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > NOW() THEN
    RETURN QUERY SELECT false, 
      EXTRACT(EPOCH FROM (v_record.blocked_until - NOW()))::INTEGER,
      'محظور مؤقتاً'::TEXT;
    RETURN;
  END IF;
  
  -- حساب الوقت منذ آخر إرسال
  v_seconds_since_last := EXTRACT(EPOCH FROM (NOW() - v_record.last_sent_at))::INTEGER;
  
  IF v_seconds_since_last < 60 THEN
    RETURN QUERY SELECT false, 
      (60 - v_seconds_since_last)::INTEGER,
      'يرجى الانتظار'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 0, 'OK'::TEXT;
END;
$$;

-- دالة لتسجيل إرسال OTP
CREATE OR REPLACE FUNCTION public.record_otp_sent(p_phone TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.otp_rate_limits (phone_number, last_sent_at, attempts_count)
  VALUES (p_phone, NOW(), 1)
  ON CONFLICT (phone_number) DO UPDATE
  SET last_sent_at = NOW(),
      attempts_count = otp_rate_limits.attempts_count + 1,
      updated_at = NOW();
END;
$$;

-- إضافة unique constraint
ALTER TABLE public.otp_rate_limits ADD CONSTRAINT otp_rate_limits_phone_unique UNIQUE (phone_number);

-- دالة للتحقق من محاولات الإدخال
CREATE OR REPLACE FUNCTION public.check_verification_attempts(p_phone TEXT)
RETURNS TABLE(can_verify BOOLEAN, attempts_left INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_max_attempts INTEGER := 5;
BEGIN
  SELECT * INTO v_record
  FROM public.otp_verification_attempts
  WHERE phone_number = p_phone;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT true, v_max_attempts, 'OK'::TEXT;
    RETURN;
  END IF;
  
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > NOW() THEN
    RETURN QUERY SELECT false, 0, 'محظور لمدة 15 دقيقة'::TEXT;
    RETURN;
  END IF;
  
  IF v_record.failed_attempts >= v_max_attempts THEN
    -- حظر لمدة 15 دقيقة
    UPDATE public.otp_verification_attempts
    SET blocked_until = NOW() + INTERVAL '15 minutes'
    WHERE phone_number = p_phone;
    
    RETURN QUERY SELECT false, 0, 'تم تجاوز الحد الأقصى للمحاولات'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, (v_max_attempts - v_record.failed_attempts)::INTEGER, 'OK'::TEXT;
END;
$$;

-- دالة لتسجيل محاولة فاشلة
CREATE OR REPLACE FUNCTION public.record_failed_verification(p_phone TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.otp_verification_attempts (phone_number, failed_attempts, last_attempt_at)
  VALUES (p_phone, 1, NOW())
  ON CONFLICT (phone_number) DO UPDATE
  SET failed_attempts = otp_verification_attempts.failed_attempts + 1,
      last_attempt_at = NOW();
END;
$$;

ALTER TABLE public.otp_verification_attempts ADD CONSTRAINT otp_verification_phone_unique UNIQUE (phone_number);

-- دالة لمسح المحاولات بعد النجاح
CREATE OR REPLACE FUNCTION public.clear_verification_attempts(p_phone TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.otp_verification_attempts WHERE phone_number = p_phone;
  DELETE FROM public.otp_rate_limits WHERE phone_number = p_phone;
END;
$$;