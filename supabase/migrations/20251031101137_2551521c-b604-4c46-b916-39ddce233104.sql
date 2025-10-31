-- جدول لإدارة الجلسات المتعددة
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- فهرسة للبحث السريع
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_token ON public.sessions(session_token);
CREATE INDEX idx_sessions_active ON public.sessions(user_id, revoked, expires_at);

-- جدول لحفظ إعدادات الأمان للمستخدمين
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  allow_multiple_sessions BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  two_factor_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لحفظ ترتيب الأيقونات والويدجتات في لوحة التحكم
CREATE TABLE IF NOT EXISTS public.user_dashboard_layout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_data JSONB NOT NULL DEFAULT '{
    "accountant": {
      "iconOrder": [],
      "viewMode": "grid",
      "widgets": []
    }
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لسجلات نشاط الأمان
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_audit_user ON public.security_audit_logs(user_id, created_at DESC);
CREATE INDEX idx_security_audit_action ON public.security_audit_logs(action, created_at DESC);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول sessions
CREATE POLICY "Users can view their own sessions"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sessions"
  ON public.sessions FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view all sessions"
  ON public.sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- سياسات RLS لجدول user_security_settings
CREATE POLICY "Users can view their own security settings"
  ON public.user_security_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
  ON public.user_security_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert security settings"
  ON public.user_security_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all security settings"
  ON public.user_security_settings FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- سياسات RLS لجدول user_dashboard_layout
CREATE POLICY "Users can view their own dashboard layout"
  ON public.user_dashboard_layout FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard layout"
  ON public.user_dashboard_layout FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard layout"
  ON public.user_dashboard_layout FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- سياسات RLS لجدول security_audit_logs
CREATE POLICY "Admins can view all security audit logs"
  ON public.security_audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security audit logs"
  ON public.security_audit_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Prevent security audit log deletion"
  ON public.security_audit_logs FOR DELETE
  USING (false);

CREATE POLICY "Prevent security audit log updates"
  ON public.security_audit_logs FOR UPDATE
  USING (false);

-- دالة لتنظيف الجلسات المنتهية
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sessions
  SET revoked = true
  WHERE expires_at < now()
    AND revoked = false;
END;
$$;

-- دالة لتسجيل نشاط أمني
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_user_id,
    p_action,
    p_resource_type,
    p_resource_id,
    p_ip_address,
    p_user_agent,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Trigger لتحديث updated_at في user_security_settings
CREATE TRIGGER update_user_security_settings_updated_at
  BEFORE UPDATE ON public.user_security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger لتحديث updated_at في user_dashboard_layout
CREATE TRIGGER update_user_dashboard_layout_updated_at
  BEFORE UPDATE ON public.user_dashboard_layout
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();