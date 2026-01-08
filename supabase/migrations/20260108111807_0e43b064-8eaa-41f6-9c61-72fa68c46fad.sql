
-- إصلاح السياسات المتبقية التي لم يتم تطبيقها

-- 14. security_audit_logs
DROP POLICY IF EXISTS "System can insert security audit logs" ON public.security_audit_logs;
CREATE POLICY "Authenticated users can insert security logs" ON public.security_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 15. sessions
DROP POLICY IF EXISTS "System can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "System can update sessions" ON public.sessions;

CREATE POLICY "Users insert own sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 16. sms_logs
DROP POLICY IF EXISTS "System can insert SMS logs" ON public.sms_logs;
DROP POLICY IF EXISTS "System can update SMS logs" ON public.sms_logs;

CREATE POLICY "Staff can insert SMS logs" ON public.sms_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can update SMS logs" ON public.sms_logs
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 17. subscriber_audit_trail
DROP POLICY IF EXISTS "System can insert audit trails" ON public.subscriber_audit_trail;
CREATE POLICY "Auth users insert audit trails" ON public.subscriber_audit_trail
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid() OR changed_by IS NULL);

-- 18. technician_stats
DROP POLICY IF EXISTS "System can manage stats" ON public.technician_stats;
CREATE POLICY "Admin manage tech stats" ON public.technician_stats
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 19. user_security_settings
DROP POLICY IF EXISTS "System can insert security settings" ON public.user_security_settings;
CREATE POLICY "Users insert security settings" ON public.user_security_settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- إنشاء الدوال المساعدة

-- دالة لإدارة OTP rate limits
CREATE OR REPLACE FUNCTION public.manage_otp_rate_limit(
  p_phone TEXT,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_record RECORD;
BEGIN
  IF p_action = 'check' THEN
    SELECT * INTO v_record FROM public.otp_rate_limits WHERE phone_number = p_phone;
    IF NOT FOUND THEN
      v_result := jsonb_build_object('can_send', true, 'wait_seconds', 0);
    ELSIF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > NOW() THEN
      v_result := jsonb_build_object('can_send', false, 'wait_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - NOW()))::INT);
    ELSIF v_record.last_sent_at > NOW() - INTERVAL '60 seconds' THEN
      v_result := jsonb_build_object('can_send', false, 'wait_seconds', 60 - EXTRACT(EPOCH FROM (NOW() - v_record.last_sent_at))::INT);
    ELSE
      v_result := jsonb_build_object('can_send', true, 'wait_seconds', 0);
    END IF;
  ELSIF p_action = 'increment' THEN
    INSERT INTO public.otp_rate_limits (phone_number, last_sent_at, attempts_count)
    VALUES (p_phone, NOW(), 1)
    ON CONFLICT (phone_number) DO UPDATE SET
      last_sent_at = NOW(),
      attempts_count = otp_rate_limits.attempts_count + 1,
      updated_at = NOW();
    v_result := jsonb_build_object('success', true);
  ELSIF p_action = 'reset' THEN
    DELETE FROM public.otp_rate_limits WHERE phone_number = p_phone;
    v_result := jsonb_build_object('success', true);
  END IF;
  
  RETURN v_result;
END;
$$;

-- دالة لإدارة password reset tokens
CREATE OR REPLACE FUNCTION public.manage_password_reset_token(
  p_user_id UUID,
  p_token_hash TEXT,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_token RECORD;
BEGIN
  IF p_action = 'create' THEN
    INSERT INTO public.password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (p_user_id, p_token_hash, NOW() + INTERVAL '1 hour')
    RETURNING id INTO v_token;
    v_result := jsonb_build_object('success', true, 'token_id', v_token.id);
  ELSIF p_action = 'validate' THEN
    SELECT * INTO v_token FROM public.password_reset_tokens 
    WHERE token_hash = p_token_hash AND expires_at > NOW() AND used = false;
    IF FOUND THEN
      v_result := jsonb_build_object('valid', true, 'user_id', v_token.user_id);
    ELSE
      v_result := jsonb_build_object('valid', false);
    END IF;
  ELSIF p_action = 'use' THEN
    UPDATE public.password_reset_tokens SET used = true WHERE token_hash = p_token_hash;
    v_result := jsonb_build_object('success', true);
  END IF;
  
  RETURN v_result;
END;
$$;

-- دالة لإدارة sessions
CREATE OR REPLACE FUNCTION public.manage_session(
  p_user_id UUID,
  p_session_token TEXT,
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_session_id UUID;
BEGIN
  IF p_action = 'create' THEN
    INSERT INTO public.sessions (user_id, session_token, ip_address, user_agent, expires_at)
    VALUES (p_user_id, p_session_token, p_ip_address, p_user_agent, NOW() + INTERVAL '30 days')
    RETURNING id INTO v_session_id;
    v_result := jsonb_build_object('success', true, 'session_id', v_session_id);
  ELSIF p_action = 'validate' THEN
    PERFORM 1 FROM public.sessions 
    WHERE session_token = p_session_token AND user_id = p_user_id 
      AND expires_at > NOW() AND revoked = false;
    v_result := jsonb_build_object('valid', FOUND);
  ELSIF p_action = 'revoke' THEN
    UPDATE public.sessions SET revoked = true 
    WHERE session_token = p_session_token AND user_id = p_user_id;
    v_result := jsonb_build_object('success', true);
  ELSIF p_action = 'revoke_all' THEN
    UPDATE public.sessions SET revoked = true WHERE user_id = p_user_id;
    v_result := jsonb_build_object('success', true);
  END IF;
  
  RETURN v_result;
END;
$$;
