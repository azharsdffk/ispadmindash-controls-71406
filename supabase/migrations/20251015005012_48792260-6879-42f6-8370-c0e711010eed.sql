
-- إزالة الصلاحيات الإدارية من دور المحاسب
-- سنترك فقط الصلاحيات المتعلقة بالمحاسبة

DELETE FROM role_permissions 
WHERE role = 'accountant' 
AND permission_id IN (
  SELECT id FROM permissions 
  WHERE name IN (
    -- صلاحيات إدارة الأدوار والمستخدمين (للمدير فقط)
    'manage_roles',
    'view_roles',
    'manage_users',
    
    -- صلاحيات إدارة الموظفين (للمدير فقط)
    'manage_employees',
    'track_employees',
    
    -- صلاحيات الإعدادات (للمدير فقط)  
    'manage_settings',
    
    -- صلاحيات الصيانة (للفنيين)
    'assign_maintenance',
    'manage_maintenance',
    'view_maintenance',
    
    -- صلاحيات الاستيراد (للمدير فقط)
    'import_data',
    'view_import_history'
  )
);
