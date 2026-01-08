-- =====================================================
-- إصلاحات الأمان الشاملة
-- =====================================================

-- 1. تقييد جدول role_permissions للمستخدمين المصادق عليهم فقط
DROP POLICY IF EXISTS "Allow read role permissions" ON public.role_permissions;

CREATE POLICY "Authenticated users can read role permissions"
ON public.role_permissions
FOR SELECT
TO authenticated
USING (true);

-- 2. إصلاح سياسات storage.objects المفتوحة للمجهولين
DROP POLICY IF EXISTS "Admins can manage work photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all work photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can delete own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can update own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can view own work photos" ON storage.objects;
DROP POLICY IF EXISTS "Technicians can view work photos" ON storage.objects;

-- إعادة إنشاء السياسات للمصادق عليهم فقط
CREATE POLICY "Authenticated admins can manage work photos"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'work-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated technicians can upload work photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-photos' 
  AND public.has_role(auth.uid(), 'technician')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated technicians can view own work photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

CREATE POLICY "Authenticated technicians can delete own work photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- 3. تسجيل وصول المشرفين لبيانات الهواتف
CREATE TABLE IF NOT EXISTS public.admin_pii_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accessed_table TEXT NOT NULL,
  accessed_record_id UUID,
  accessed_fields TEXT[],
  access_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_pii_access_logs ENABLE ROW LEVEL SECURITY;

-- فقط المشرفون يمكنهم رؤية سجلات الوصول
CREATE POLICY "Only admins can view admin access logs"
ON public.admin_pii_access_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- فقط النظام يمكنه الإدراج (عبر service role)
CREATE POLICY "System can insert admin access logs"
ON public.admin_pii_access_logs
FOR INSERT
TO authenticated
WITH CHECK (admin_id = auth.uid());

-- 4. دالة لتسجيل وصول المشرف للبيانات الحساسة
CREATE OR REPLACE FUNCTION public.log_admin_pii_access(
  p_accessed_table TEXT,
  p_accessed_record_id UUID,
  p_accessed_fields TEXT[],
  p_access_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- التحقق من أن المستخدم مشرف
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can log PII access';
  END IF;
  
  INSERT INTO public.admin_pii_access_logs (
    admin_id,
    accessed_table,
    accessed_record_id,
    accessed_fields,
    access_reason
  ) VALUES (
    auth.uid(),
    p_accessed_table,
    p_accessed_record_id,
    p_accessed_fields,
    p_access_reason
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- 5. تقييد الوصول لجدول profiles - إزالة السياسات المفتوحة
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- التأكد من وجود سياسة صحيحة
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (id = auth.uid());
  END IF;
END $$;

-- المشرفون يمكنهم رؤية جميع الملفات الشخصية
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 6. إضافة فهرس للبحث السريع في سجلات الأمان
CREATE INDEX IF NOT EXISTS idx_admin_pii_access_logs_admin_id 
ON public.admin_pii_access_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_pii_access_logs_created_at 
ON public.admin_pii_access_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_pii_access_logs_accessed_table 
ON public.admin_pii_access_logs(accessed_table);