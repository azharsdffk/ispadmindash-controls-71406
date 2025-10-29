-- إضافة صلاحيات العقود
INSERT INTO public.permissions (name, description, category) VALUES
  ('contracts.view', 'عرض العقود', 'contracts'),
  ('contracts.create', 'إنشاء عقود جديدة', 'contracts'),
  ('contracts.update', 'تعديل العقود', 'contracts'),
  ('contracts.delete', 'حذف العقود', 'contracts')
ON CONFLICT (name) DO NOTHING;

-- ربط صلاحيات العقود بدور المدير
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id
FROM public.permissions
WHERE name IN ('contracts.view', 'contracts.create', 'contracts.update', 'contracts.delete')
ON CONFLICT DO NOTHING;

-- ربط صلاحيات العقود بدور المحاسب
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'accountant'::app_role, id
FROM public.permissions
WHERE name IN ('contracts.view', 'contracts.create', 'contracts.update')
ON CONFLICT DO NOTHING;