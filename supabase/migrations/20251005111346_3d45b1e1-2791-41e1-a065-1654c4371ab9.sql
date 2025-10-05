-- إنشاء جدول الصلاحيات (Permissions)
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) UNIQUE NOT NULL,
  description text,
  category varchar(50),
  created_at timestamp with time zone DEFAULT now()
);

-- إنشاء جدول علاقة الأدوار بالصلاحيات (Role Permissions)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id uuid REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- تفعيل RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للصلاحيات
CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view permissions"
ON public.permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- سياسات الأمان لعلاقة الأدوار بالصلاحيات
CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view role permissions"
ON public.role_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- دالة للتحقق من صلاحية معينة للمستخدم
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_name varchar)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = _user_id
      AND p.name = _permission_name
  )
$$;

-- إدراج الصلاحيات الافتراضية
INSERT INTO public.permissions (name, description, category) VALUES
  -- لوحة التحكم
  ('view_dashboard', 'عرض لوحة التحكم', 'dashboard'),
  
  -- المستخدمين
  ('manage_users', 'إدارة المستخدمين والموظفين', 'users'),
  ('view_users', 'عرض المستخدمين والموظفين', 'users'),
  
  -- المشتركين
  ('manage_subscribers', 'إدارة المشتركين (إضافة، تعديل، حذف)', 'subscribers'),
  ('view_subscribers', 'عرض بيانات المشتركين', 'subscribers'),
  ('update_subscriber_location', 'تحديث موقع المشترك', 'subscribers'),
  
  -- الفواتير
  ('manage_invoices', 'إدارة الفواتير (إصدار، تعديل، حذف)', 'invoices'),
  ('view_invoices', 'عرض الفواتير', 'invoices'),
  
  -- المدفوعات
  ('manage_payments', 'إدارة المدفوعات والسندات', 'payments'),
  ('view_payments', 'عرض المدفوعات', 'payments'),
  
  -- التقارير
  ('view_reports', 'عرض التقارير المالية والإحصائية', 'reports'),
  ('export_reports', 'تصدير التقارير', 'reports'),
  
  -- الموظفين
  ('manage_employees', 'إدارة الموظفين', 'employees'),
  ('view_employees', 'عرض الموظفين', 'employees'),
  ('track_employees', 'تتبع مواقع الموظفين', 'employees'),
  
  -- الصيانة
  ('manage_maintenance', 'إدارة طلبات الصيانة', 'maintenance'),
  ('view_maintenance', 'عرض طلبات الصيانة', 'maintenance'),
  ('assign_maintenance', 'تعيين الفنيين لطلبات الصيانة', 'maintenance'),
  
  -- المخزون
  ('manage_inventory', 'إدارة المخزون', 'inventory'),
  ('view_inventory', 'عرض المخزون', 'inventory'),
  
  -- السندات
  ('manage_vouchers', 'إدارة سندات القبض والصرف', 'vouchers'),
  ('view_vouchers', 'عرض السندات', 'vouchers'),
  
  -- الصلاحيات
  ('manage_roles', 'إدارة الأدوار والصلاحيات', 'roles'),
  ('view_roles', 'عرض الأدوار والصلاحيات', 'roles'),
  
  -- الإشعارات
  ('view_notifications', 'عرض الإشعارات', 'notifications'),
  ('send_notifications', 'إرسال إشعارات', 'notifications'),
  
  -- الإعدادات
  ('manage_settings', 'إدارة إعدادات النظام', 'settings'),
  ('view_settings', 'عرض الإعدادات', 'settings'),
  
  -- الباقات
  ('manage_packages', 'إدارة باقات الإنترنت', 'packages'),
  ('view_packages', 'عرض الباقات', 'packages'),
  
  -- الاستيراد
  ('import_data', 'استيراد البيانات', 'import'),
  ('view_import_history', 'عرض سجل الاستيراد', 'import')
ON CONFLICT (name) DO NOTHING;

-- ربط الصلاحيات بدور Admin (كل الصلاحيات)
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT DO NOTHING;

-- ربط الصلاحيات بدور Accountant
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::app_role, id FROM public.permissions 
WHERE name IN (
  'view_dashboard',
  'view_subscribers',
  'manage_invoices',
  'view_invoices',
  'manage_payments',
  'view_payments',
  'view_reports',
  'export_reports',
  'manage_vouchers',
  'view_vouchers',
  'view_inventory',
  'view_packages',
  'view_notifications'
)
ON CONFLICT DO NOTHING;

-- ربط الصلاحيات بدور Technician
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'technician'::app_role, id FROM public.permissions
WHERE name IN (
  'view_dashboard',
  'view_subscribers',
  'manage_subscribers',
  'update_subscriber_location',
  'manage_maintenance',
  'view_maintenance',
  'view_inventory',
  'view_notifications',
  'view_packages'
)
ON CONFLICT DO NOTHING;

-- ربط الصلاحيات بدور Client
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'client'::app_role, id FROM public.permissions
WHERE name IN (
  'view_dashboard',
  'view_invoices',
  'view_payments',
  'view_maintenance',
  'view_notifications',
  'view_packages'
)
ON CONFLICT DO NOTHING;

-- تعليق توضيحي
COMMENT ON TABLE public.permissions IS 'جدول الصلاحيات - يحدد ما يمكن للمستخدم فعله في النظام';
COMMENT ON TABLE public.role_permissions IS 'جدول ربط الأدوار بالصلاحيات - علاقة many-to-many';
COMMENT ON FUNCTION public.has_permission IS 'دالة للتحقق من امتلاك المستخدم لصلاحية معينة';