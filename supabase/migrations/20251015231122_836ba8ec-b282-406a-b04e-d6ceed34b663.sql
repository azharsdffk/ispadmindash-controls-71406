-- إضافة الصلاحيات الجديدة
INSERT INTO permissions (name, description, category)
VALUES
  ('manage_accounts', 'إدارة الحسابات والأرصدة', 'accounting'),
  ('view_balance', 'عرض الأرصدة العامة', 'accounting'),
  ('add_transaction', 'إضافة قيد محاسبي', 'accounting')
ON CONFLICT (name) DO NOTHING;

-- ربط الصلاحيات الجديدة بدور accountant
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant'::app_role, id
FROM permissions
WHERE name IN (
  'manage_accounts',
  'view_balance',
  'add_transaction'
)
ON CONFLICT DO NOTHING;