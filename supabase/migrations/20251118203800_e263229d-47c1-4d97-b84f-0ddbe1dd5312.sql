-- تحسينات الأمان والأداء

-- 1. إضافة indexes مهمة للأداء
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at) WHERE revoked = false;
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read);

-- 2. إضافة constraint لمنع دوبليكيت في الأدوار
-- Already exists: user_roles_user_id_role_key

-- 3. تحسين RLS policies للأداء
-- إضافة policy للـ profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. إضافة triggers للتنظيف التلقائي
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- حذف الجلسات المنتهية القديمة (أكثر من 30 يوم)
  DELETE FROM public.sessions
  WHERE expires_at < NOW() - INTERVAL '30 days'
    AND revoked = true;
  
  -- حذف محاولات تسجيل الدخول القديمة (أكثر من 90 يوم)
  DELETE FROM public.login_attempts
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- حذف rate limit attempts القديمة
  DELETE FROM public.rate_limit_attempts
  WHERE last_attempt_at < NOW() - INTERVAL '7 days';
END;
$$;

-- 5. إضافة constraint للتحقق من البيانات
ALTER TABLE public.subscribers
ADD CONSTRAINT check_balance_not_negative
CHECK (balance >= -1000000); -- السماح برصيد سالب محدود

-- 6. تحسين security للـ profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. إضافة unique constraint للبريد الإلكتروني في المشتركين
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_email_unique 
ON public.subscribers(email) 
WHERE email IS NOT NULL;

-- 8. إضافة policy للـ role_permissions
DROP POLICY IF EXISTS "Allow read role permissions" ON public.role_permissions;
CREATE POLICY "Allow read role permissions" ON public.role_permissions
  FOR SELECT USING (true);

COMMENT ON FUNCTION cleanup_old_data() IS 'دالة لتنظيف البيانات القديمة تلقائياً';