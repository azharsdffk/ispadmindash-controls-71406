
-- إصلاح سياسة technician_ratings باستخدام subscriber_id
DROP POLICY IF EXISTS "System can insert ratings" ON public.technician_ratings;
CREATE POLICY "Authenticated users can insert ratings" ON public.technician_ratings
  FOR INSERT TO authenticated
  WITH CHECK (subscriber_id IS NOT NULL);

-- إضافة سياسات لجدول phone_otps
CREATE POLICY "Admins can view all OTPs" ON public.phone_otps
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete expired OTPs" ON public.phone_otps
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- تحديث سياسات storage.objects لـ work-photos
DROP POLICY IF EXISTS "Technicians can view work photos" ON storage.objects;
CREATE POLICY "Technicians can view work photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'work-photos' AND
    (
      public.has_role(auth.uid(), 'technician') OR
      public.has_role(auth.uid(), 'admin')
    )
  );

-- دالة لإدخال محاولات تسجيل الدخول
CREATE OR REPLACE FUNCTION public.insert_login_attempt(
  p_email TEXT,
  p_user_id UUID,
  p_success BOOLEAN,
  p_ip_address INET,
  p_user_agent TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.login_attempts (
    email, user_id, success, ip_address, user_agent, error_message
  ) VALUES (
    p_email, p_user_id, p_success, p_ip_address, p_user_agent, p_error_message
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- دالة لإدخال سجلات SMS
CREATE OR REPLACE FUNCTION public.insert_sms_log(
  p_phone TEXT,
  p_message TEXT,
  p_template_id UUID DEFAULT NULL,
  p_subscriber_id UUID DEFAULT NULL,
  p_status TEXT DEFAULT 'pending'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.sms_logs (
    phone, message, template_id, subscriber_id, status, created_by
  ) VALUES (
    p_phone, p_message, p_template_id, p_subscriber_id, p_status, auth.uid()
  ) RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- دالة لتحديث حالة SMS
CREATE OR REPLACE FUNCTION public.update_sms_log_status(
  p_id UUID,
  p_status TEXT,
  p_provider_response JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sms_logs
  SET status = p_status, provider_response = p_provider_response
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$;
