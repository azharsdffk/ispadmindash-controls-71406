-- ملف البيانات التجريبية - ISP Management System
-- نفّذ هذا السكريبت في Lovable Backend → SQL Editor

-- ⚠️ تحذير: هذا السكريبت سيضيف بيانات تجريبية
-- لا تنفّذه في قاعدة بيانات الإنتاج!

-- ===========================================
-- 1. إنشاء مستخدمين تجريبيين
-- ===========================================

-- ملاحظة: يجب تسجيل هؤلاء المستخدمين من الواجهة أولاً
-- ثم تشغيل هذا السكريبت لتعيين الأدوار

-- Admin User: admin@isp.local / Admin@123
-- Technician User: tech@isp.local / Tech@123
-- Accountant User: accountant@isp.local / Account@123
-- Client User: client@isp.local / Client@123

-- ===========================================
-- 2. تعيين الأدوار (بعد التسجيل)
-- ===========================================

-- ⚠️ استبدل 'USER_UUID_HERE' بالـ UUID الحقيقي بعد التسجيل

-- Admin Role
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Technician Role
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'technician')
ON CONFLICT (user_id, role) DO NOTHING;

-- Accountant Role
INSERT INTO user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'accountant')
ON CONFLICT (user_id, role) DO NOTHING;

-- ===========================================
-- 3. مشتركين تجريبيين
-- ===========================================

INSERT INTO subscribers (service_id, name, phone, address, plan, status, balance)
VALUES 
  ('SAS-12345', 'أحمد محمد علي', '07701234567', 'بغداد - الكرادة - شارع 52 - بناية 10', '10 ميجا', 'active', 0),
  ('SAS-12346', 'فاطمة حسن', '07712345678', 'بغداد - المنصور - حي الإسكان', '20 ميجا', 'active', 0),
  ('NP-54321', 'محمد عبدالله', '07723456789', 'النجف - حي الجهاد', '50 ميجا', 'active', 25000),
  ('NP-54322', 'سارة خالد', '07734567890', 'كربلاء - حي الحسين', '100 ميجا', 'suspended', -50000),
  ('SAS-12347', 'علي حسين', '07745678901', 'البصرة - الزبير - حي المعلمين', '30 ميجا', 'active', 0)
ON CONFLICT (service_id) DO NOTHING;

-- ===========================================
-- 4. تذاكر صيانة تجريبية
-- ===========================================

-- احصل على IDs المشتركين
WITH subscriber_ids AS (
  SELECT id, service_id FROM subscribers WHERE service_id IN ('SAS-12345', 'SAS-12346', 'NP-54321')
)

-- أدخل تذاكر تجريبية
INSERT INTO maintenance_tickets (
  ticket_number, 
  subscriber_id, 
  issue_description, 
  priority, 
  status,
  created_by,
  notes
)
SELECT 
  'TKT-202501-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
  s.id,
  CASE 
    WHEN s.service_id = 'SAS-12345' THEN 'انقطاع متكرر في الخدمة - يحتاج فحص الكيبل'
    WHEN s.service_id = 'SAS-12346' THEN 'سرعة بطيئة جداً - أقل من المتوقع'
    ELSE 'لا يوجد اتصال بالإنترنت نهائياً'
  END,
  CASE 
    WHEN s.service_id = 'SAS-12345' THEN 'high'
    WHEN s.service_id = 'SAS-12346' THEN 'medium'
    ELSE 'urgent'
  END,
  CASE 
    WHEN s.service_id = 'SAS-12345' THEN 'in_progress'
    WHEN s.service_id = 'SAS-12346' THEN 'open'
    ELSE 'open'
  END,
  (SELECT id FROM auth.users LIMIT 1), -- سيتم تعيين المستخدم الأول
  'موقع GPS: 33.3152, 44.3661' -- بغداد
FROM subscriber_ids s;

-- ===========================================
-- 5. فواتير تجريبية
-- ===========================================

WITH subscriber_ids AS (
  SELECT id, service_id, plan FROM subscribers WHERE service_id IN ('SAS-12345', 'SAS-12346', 'NP-54321')
)

INSERT INTO invoices (
  invoice_number,
  subscriber_id,
  amount,
  currency,
  status,
  issue_date,
  due_date,
  description
)
SELECT 
  'INV-202501-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
  s.id,
  CASE 
    WHEN s.plan = '10 ميجا' THEN 30000
    WHEN s.plan = '20 ميجا' THEN 50000
    WHEN s.plan = '50 ميجا' THEN 100000
    ELSE 30000
  END,
  'IQD',
  CASE 
    WHEN s.service_id = 'SAS-12345' THEN 'paid'
    WHEN s.service_id = 'SAS-12346' THEN 'pending'
    ELSE 'overdue'
  END,
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '25 days',
  'فاتورة اشتراك شهري - ' || s.plan
FROM subscriber_ids s;

-- ===========================================
-- 6. سندات قبض تجريبية
-- ===========================================

WITH invoice_ids AS (
  SELECT 
    i.id as invoice_id,
    i.invoice_number,
    i.amount,
    s.id as subscriber_id
  FROM invoices i
  JOIN subscribers s ON i.subscriber_id = s.id
  WHERE i.status = 'paid'
  LIMIT 2
)

INSERT INTO receipts (
  receipt_number,
  subscriber_id,
  amount,
  currency,
  payment_method,
  invoice_id,
  notes
)
SELECT 
  'REC-202501-' || LPAD((ROW_NUMBER() OVER ())::TEXT, 6, '0'),
  i.subscriber_id,
  i.amount,
  'IQD',
  CASE 
    WHEN ROW_NUMBER() OVER () = 1 THEN 'cash'
    ELSE 'bank_transfer'
  END,
  i.invoice_id,
  'دفعة كاملة - ' || i.invoice_number
FROM invoice_ids i;

-- ===========================================
-- 7. موظفين تجريبيين
-- ===========================================

-- ⚠️ استبدل USER_UUIDs بالـ UUIDs الحقيقية

INSERT INTO employees (
  user_id,
  full_name,
  phone,
  address,
  position,
  status,
  salary,
  hire_date
)
VALUES 
  (
    'TECH_USER_UUID', -- UUID للفني
    'أحمد التقني',
    '07701111111',
    'بغداد - الكرادة',
    'technician',
    'active',
    500000,
    CURRENT_DATE - INTERVAL '6 months'
  ),
  (
    'ACCOUNTANT_USER_UUID', -- UUID للمحاسب
    'فاطمة المحاسبة',
    '07702222222',
    'بغداد - المنصور',
    'accountant',
    'active',
    600000,
    CURRENT_DATE - INTERVAL '1 year'
  )
ON CONFLICT (user_id) DO NOTHING;

-- ===========================================
-- 8. خطط الاشتراك
-- ===========================================

INSERT INTO plans (
  name,
  speed,
  price_iqd,
  price_usd,
  description,
  is_active
)
VALUES 
  ('باقة النحاس', '10 ميجا', 30000, 20, 'باقة اقتصادية للاستخدام الخفيف', true),
  ('باقة الفضة', '20 ميجا', 50000, 35, 'باقة متوسطة للاستخدام العائلي', true),
  ('باقة الذهب', '50 ميجا', 100000, 70, 'باقة قوية للاستخدام المكثف', true),
  ('باقة البلاتين', '100 ميجا', 180000, 125, 'باقة احترافية لرجال الأعمال', true),
  ('باقة الألماس', '200 ميجا', 300000, 205, 'أقوى باقة - للشركات', true)
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- 9. إعدادات النظام
-- ===========================================

INSERT INTO settings (key, value, description)
VALUES 
  ('company_name', '{"ar": "شركة الإنترنت السريع", "en": "Fast Internet Company"}', 'اسم الشركة'),
  ('company_phone', '07700000000', 'هاتف الشركة'),
  ('company_email', 'info@isp.local', 'بريد الشركة'),
  ('company_address', 'بغداد - الكرادة - شارع الرئيسي', 'عنوان الشركة'),
  ('default_currency', 'IQD', 'العملة الافتراضية'),
  ('exchange_rate_usd_to_iqd', '1470', 'سعر صرف الدولار إلى دينار'),
  ('invoice_prefix', 'INV', 'بادئة رقم الفاتورة'),
  ('receipt_prefix', 'REC', 'بادئة رقم سند القبض'),
  ('ticket_prefix', 'TKT', 'بادئة رقم التذكرة'),
  ('sas_api_url', 'https://api.sas.example.com', 'رابط API لـ SAS'),
  ('np_api_url', 'https://api.national-project.example.com', 'رابط API للمشروع الوطني')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ===========================================
-- 10. صلاحيات تجريبية
-- ===========================================

INSERT INTO permissions (name, description, category)
VALUES 
  ('view_subscribers', 'عرض المشتركين', 'subscribers'),
  ('create_subscribers', 'إضافة مشتركين', 'subscribers'),
  ('edit_subscribers', 'تعديل المشتركين', 'subscribers'),
  ('delete_subscribers', 'حذف المشتركين', 'subscribers'),
  
  ('view_tickets', 'عرض التذاكر', 'tickets'),
  ('create_tickets', 'إنشاء تذاكر', 'tickets'),
  ('edit_tickets', 'تعديل التذاكر', 'tickets'),
  ('close_tickets', 'إغلاق التذاكر', 'tickets'),
  
  ('view_invoices', 'عرض الفواتير', 'invoices'),
  ('create_invoices', 'إصدار فواتير', 'invoices'),
  ('edit_invoices', 'تعديل الفواتير', 'invoices'),
  ('cancel_invoices', 'إلغاء الفواتير', 'invoices'),
  
  ('view_reports', 'عرض التقارير', 'reports'),
  ('export_reports', 'تصدير التقارير', 'reports'),
  
  ('manage_employees', 'إدارة الموظفين', 'employees'),
  ('manage_roles', 'إدارة الأدوار والصلاحيات', 'settings'),
  ('manage_settings', 'إدارة إعدادات النظام', 'settings')
ON CONFLICT (name) DO NOTHING;

-- ربط الصلاحيات بالأدوار
INSERT INTO role_permissions (role, permission_id)
SELECT 
  'admin', 
  id 
FROM permissions
ON CONFLICT DO NOTHING;

-- صلاحيات الفني
INSERT INTO role_permissions (role, permission_id)
SELECT 
  'technician', 
  id 
FROM permissions 
WHERE name IN (
  'view_subscribers',
  'view_tickets',
  'create_tickets',
  'edit_tickets'
)
ON CONFLICT DO NOTHING;

-- صلاحيات المحاسب
INSERT INTO role_permissions (role, permission_id)
SELECT 
  'accountant', 
  id 
FROM permissions 
WHERE name IN (
  'view_subscribers',
  'view_invoices',
  'create_invoices',
  'edit_invoices',
  'view_reports',
  'export_reports'
)
ON CONFLICT DO NOTHING;

-- ===========================================
-- 11. التحقق من البيانات
-- ===========================================

-- عرض إحصائيات سريعة
SELECT 
  'Subscribers' as table_name, 
  COUNT(*) as count 
FROM subscribers

UNION ALL

SELECT 
  'Tickets', 
  COUNT(*) 
FROM maintenance_tickets

UNION ALL

SELECT 
  'Invoices', 
  COUNT(*) 
FROM invoices

UNION ALL

SELECT 
  'Receipts', 
  COUNT(*) 
FROM receipts

UNION ALL

SELECT 
  'Plans', 
  COUNT(*) 
FROM plans

UNION ALL

SELECT 
  'User Roles', 
  COUNT(*) 
FROM user_roles;

-- ===========================================
-- ✅ تم! البيانات التجريبية جاهزة
-- ===========================================

-- الخطوات التالية:
-- 1. سجل دخول كـ admin@isp.local
-- 2. استكشف النظام
-- 3. جرب إنشاء تذاكر
-- 4. جرب سحب بيانات مشتركين
-- 5. استمتع بالنظام!

-- ملاحظة: لا تنسَ تحديث UUIDs للمستخدمين في الأقسام 2 و 7
