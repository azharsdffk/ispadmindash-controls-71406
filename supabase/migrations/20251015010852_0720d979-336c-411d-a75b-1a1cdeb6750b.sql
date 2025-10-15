
-- إزالة جميع الصلاحيات الإدارية من دور المحاسب
-- نترك فقط الصلاحيات المحاسبية الأساسية

DELETE FROM role_permissions 
WHERE role = 'accountant' 
AND permission_id IN (
  SELECT id FROM permissions 
  WHERE name IN (
    -- صلاحيات لوحة التحكم (للمدير فقط)
    'view_dashboard',
    
    -- صلاحيات إدارة الموظفين (للمدير فقط)
    'view_employees',
    'manage_employees',
    'track_employees',
    
    -- صلاحيات الباقات (للمدير فقط)
    'manage_packages',
    'view_packages',
    
    -- صلاحيات المستخدمين (للمدير فقط)
    'view_users',
    'manage_users',
    
    -- صلاحيات الأدوار (للمدير فقط)
    'manage_roles',
    'view_roles',
    
    -- صلاحيات الإعدادات (للمدير فقط)
    'manage_settings',
    
    -- صلاحيات الاستيراد (للمدير فقط)
    'import_data',
    'view_import_history',
    
    -- صلاحيات الصيانة (للفنيين)
    'assign_maintenance',
    'manage_maintenance',
    'view_maintenance',
    
    -- صلاحيات إرسال الإشعارات (للمدير فقط)
    'send_notifications',
    
    -- صلاحيات تحديث مواقع المشتركين (للفنيين)
    'update_subscriber_location'
  )
);

-- التأكد من وجود الصلاحيات المحاسبية الأساسية فقط
-- (view_accountant_dashboard, manage_subscribers, view_subscribers, 
--  manage_invoices, view_invoices, manage_payments, view_payments,
--  manage_vouchers, view_vouchers, view_inventory, manage_inventory,
--  view_reports, export_reports, view_notifications)
