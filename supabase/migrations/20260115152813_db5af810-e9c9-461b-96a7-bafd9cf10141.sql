
-- إضافة الصلاحيات الجديدة
INSERT INTO public.permissions (name, description, category) VALUES
  -- إدارة المستخدمين
  ('create_user', 'إنشاء مستخدم جديد', 'users'),
  ('edit_user', 'تعديل بيانات مستخدم', 'users'),
  ('delete_user', 'حذف مستخدم', 'users'),
  
  -- التذاكر
  ('create_ticket', 'إنشاء تذكرة صيانة', 'tickets'),
  ('edit_ticket', 'تعديل تذكرة صيانة', 'tickets'),
  ('view_tickets', 'عرض التذاكر', 'tickets'),
  ('assign_ticket', 'تعيين فني للتذكرة', 'tickets'),
  ('close_ticket', 'إغلاق التذكرة', 'tickets'),
  
  -- المالية
  ('view_finance', 'عرض البيانات المالية', 'finance'),
  ('edit_invoice', 'تعديل الفواتير', 'finance'),
  ('create_invoice', 'إنشاء فاتورة', 'finance'),
  ('delete_invoice', 'حذف فاتورة', 'finance'),
  ('record_payment', 'تسجيل دفعة', 'finance'),
  
  -- التقارير
  ('view_reports_technical', 'عرض التقارير الفنية', 'reports'),
  ('view_reports_financial', 'عرض التقارير المالية', 'reports'),
  
  -- الأدوار والصلاحيات
  ('manage_roles', 'إدارة الأدوار والصلاحيات', 'system'),
  ('manage_system', 'إدارة إعدادات النظام', 'system')
ON CONFLICT (name) DO NOTHING;

-- إنشاء جدول لتسجيل العمليات الحساسة مع مزيد من التفاصيل
CREATE TABLE IF NOT EXISTS public.sensitive_operations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إضافة عمود version للجداول الحساسة لمنع التعارض (Optimistic Locking)
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.maintenance_tickets ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- دالة لزيادة رقم الإصدار تلقائياً
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$;

-- Triggers للإصدارات
DROP TRIGGER IF EXISTS increment_subscribers_version ON public.subscribers;
CREATE TRIGGER increment_subscribers_version
  BEFORE UPDATE ON public.subscribers
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_invoices_version ON public.invoices;
CREATE TRIGGER increment_invoices_version
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS increment_tickets_version ON public.maintenance_tickets;
CREATE TRIGGER increment_tickets_version
  BEFORE UPDATE ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_version();

-- دالة للتحقق من الإصدار قبل التحديث
CREATE OR REPLACE FUNCTION public.check_version(
  p_table_name TEXT,
  p_record_id UUID,
  p_expected_version INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_version INTEGER;
BEGIN
  EXECUTE format('SELECT version FROM public.%I WHERE id = $1', p_table_name)
  INTO v_current_version
  USING p_record_id;
  
  RETURN v_current_version = p_expected_version;
END;
$$;

-- دالة لتسجيل العمليات الحساسة
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.sensitive_operations_log (
    user_id, action, resource_type, resource_id, old_data, new_data, ip_address, user_agent
  ) VALUES (
    auth.uid(), p_action, p_resource_type, p_resource_id, p_old_data, p_new_data, p_ip_address, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- تفعيل RLS على الجدول الجديد
ALTER TABLE public.sensitive_operations_log ENABLE ROW LEVEL SECURITY;

-- سياسة RLS: فقط المدراء يمكنهم رؤية السجل
CREATE POLICY "Admins can view sensitive operations log"
ON public.sensitive_operations_log
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

-- سياسة RLS: السماح بالإدراج للمستخدمين المسجلين
CREATE POLICY "Authenticated users can insert logs"
ON public.sensitive_operations_log
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);
