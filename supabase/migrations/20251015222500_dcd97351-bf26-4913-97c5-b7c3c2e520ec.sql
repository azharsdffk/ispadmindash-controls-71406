-- إضافة صلاحيات المحاسب الشاملة
INSERT INTO permissions (name, description, category) VALUES
  ('view_general_ledger', 'عرض دفتر الأستاذ العام', 'accounting'),
  ('add_journal_entry', 'إضافة قيد محاسبي', 'accounting'),
  ('edit_journal_entry', 'تعديل قيد محاسبي', 'accounting'),
  ('view_balance_sheet', 'عرض الميزانية العمومية', 'accounting'),
  ('view_income_statement', 'عرض قائمة الدخل', 'accounting'),
  ('view_cash_flow', 'عرض قائمة التدفقات النقدية', 'accounting'),
  ('view_trial_balance', 'عرض ميزان المراجعة', 'accounting'),
  ('export_financial_reports', 'تصدير التقارير المالية', 'accounting'),
  ('view_accounting_entries', 'عرض القيود المحاسبية', 'accounting'),
  ('manage_chart_of_accounts', 'إدارة شجرة الحسابات', 'accounting'),
  ('view_financial_charts', 'عرض الرسوم البيانية المالية', 'accounting')
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description, 
    category = EXCLUDED.category;

-- ربط جميع صلاحيات المحاسب بدور accountant
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant', p.id 
FROM permissions p
WHERE p.name IN (
  'view_accountant_dashboard',
  'view_reports',
  'export_reports',
  'view_invoices',
  'manage_invoices',
  'view_payments',
  'manage_payments',
  'view_vouchers',
  'manage_vouchers',
  'view_subscribers',
  'view_inventory',
  'view_general_ledger',
  'add_journal_entry',
  'edit_journal_entry',
  'view_balance_sheet',
  'view_income_statement',
  'view_cash_flow',
  'view_trial_balance',
  'export_financial_reports',
  'view_accounting_entries',
  'manage_chart_of_accounts',
  'view_financial_charts'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- إنشاء دالة لتحديث صلاحيات المستخدم
CREATE OR REPLACE FUNCTION refresh_user_permissions(p_user_id UUID)
RETURNS TABLE (
  permission_name VARCHAR,
  permission_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name::VARCHAR, p.description
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role = rp.role
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id;
END;
$$;