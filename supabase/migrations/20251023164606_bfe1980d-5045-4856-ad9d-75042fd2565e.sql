-- إضافة الصلاحيات الخاصة بالفني
INSERT INTO permissions (name, description, category)
VALUES
  ('view_maintenance', 'عرض تذاكر الصيانة', 'maintenance'),
  ('assign_maintenance', 'تعيين فنيين على التذاكر', 'maintenance'),
  ('update_maintenance_status', 'تحديث حالة الصيانة', 'maintenance'),
  ('view_customers', 'عرض بيانات المشتركين', 'customers'),
  ('add_maintenance_report', 'إضافة تقرير صيانة', 'maintenance'),
  ('view_notifications', 'عرض الإشعارات', 'notifications'),
  ('upload_images', 'رفع صور الصيانة', 'media')
ON CONFLICT (name) DO NOTHING;

-- ربط الصلاحيات بدور الفني
INSERT INTO role_permissions (role, permission_id)
SELECT 'technician'::app_role, id
FROM permissions
WHERE name IN (
  'view_maintenance',
  'assign_maintenance',
  'update_maintenance_status',
  'view_customers',
  'add_maintenance_report',
  'view_notifications',
  'upload_images'
)
ON CONFLICT DO NOTHING;