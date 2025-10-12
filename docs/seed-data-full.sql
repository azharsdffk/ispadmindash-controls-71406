-- ===============================================
-- ISP Management System - Complete Seed Data
-- نظام إدارة ISP - بيانات تجريبية كاملة
-- ===============================================

-- Clear existing data (in correct order to avoid FK violations)
TRUNCATE TABLE 
  pii_access_logs,
  subscriber_audit_trail,
  employee_access_logs,
  login_attempts,
  notifications,
  geofence_events,
  employee_locations,
  connection_history,
  payments,
  invoices,
  maintenance_tickets,
  complaints,
  schedule,
  expense_vouchers,
  vouchers,
  import_logs,
  external_imports,
  inventory,
  exchange_rates,
  subscriber_users,
  subscribers,
  employees,
  technicians,
  geofence_zones,
  location_tracking_settings,
  packages,
  user_roles,
  role_permissions,
  permissions,
  audit_logs,
  profiles
CASCADE;

-- ===============================================
-- 1. Permissions (الصلاحيات)
-- ===============================================
INSERT INTO permissions (id, name, category, description) VALUES
  (gen_random_uuid(), 'view_subscribers', 'subscribers', 'عرض بيانات المشتركين'),
  (gen_random_uuid(), 'create_subscribers', 'subscribers', 'إضافة مشتركين جدد'),
  (gen_random_uuid(), 'edit_subscribers', 'subscribers', 'تعديل بيانات المشتركين'),
  (gen_random_uuid(), 'delete_subscribers', 'subscribers', 'حذف المشتركين'),
  (gen_random_uuid(), 'view_tickets', 'maintenance', 'عرض تذاكر الصيانة'),
  (gen_random_uuid(), 'create_tickets', 'maintenance', 'إنشاء تذاكر صيانة'),
  (gen_random_uuid(), 'edit_tickets', 'maintenance', 'تعديل تذاكر الصيانة'),
  (gen_random_uuid(), 'view_invoices', 'billing', 'عرض الفواتير'),
  (gen_random_uuid(), 'create_invoices', 'billing', 'إنشاء فواتير'),
  (gen_random_uuid(), 'view_payments', 'billing', 'عرض المدفوعات'),
  (gen_random_uuid(), 'create_payments', 'billing', 'تسجيل مدفوعات'),
  (gen_random_uuid(), 'view_reports', 'reports', 'عرض التقارير'),
  (gen_random_uuid(), 'manage_employees', 'employees', 'إدارة الموظفين'),
  (gen_random_uuid(), 'manage_inventory', 'inventory', 'إدارة المخزون');

-- ===============================================
-- 2. Role Permissions (صلاحيات الأدوار)
-- ===============================================
-- Admin permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'admin', id FROM permissions;

-- Accountant permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'accountant', id FROM permissions 
WHERE category IN ('subscribers', 'billing', 'reports', 'inventory');

-- Technician permissions
INSERT INTO role_permissions (role, permission_id)
SELECT 'technician', id FROM permissions 
WHERE category IN ('maintenance', 'subscribers') AND name LIKE 'view_%';

-- ===============================================
-- 3. Packages (الباقات)
-- ===============================================
INSERT INTO packages (id, name, name_en, description, speed_mbps, monthly_price, currency, active) VALUES
  (gen_random_uuid(), 'باقة البرونز', 'Bronze Package', 'باقة اقتصادية للاستخدام المنزلي', 10, 25000, 'IQD', true),
  (gen_random_uuid(), 'باقة الفضة', 'Silver Package', 'باقة متوسطة للاستخدام العائلي', 25, 40000, 'IQD', true),
  (gen_random_uuid(), 'باقة الذهب', 'Gold Package', 'باقة متقدمة لعدة أجهزة', 50, 60000, 'IQD', true),
  (gen_random_uuid(), 'باقة البلاتين', 'Platinum Package', 'باقة مميزة بسرعة عالية', 100, 100000, 'IQD', true),
  (gen_random_uuid(), 'باقة الأعمال', 'Business Package', 'باقة للشركات والمكاتب', 200, 200000, 'IQD', true);

-- ===============================================
-- 4. Subscribers (المشتركون)
-- ===============================================
INSERT INTO subscribers (id, name, phone, phone_secondary, email, address, address_notes, username, plan, balance, latitude, longitude, status_comment) VALUES
  (gen_random_uuid(), 'أحمد محمد علي', '07701234567', '07801234567', 'ahmed@example.com', 'بغداد - الكرادة', 'بناية السلام - الطابق الثالث', 'ahmed_m', 'باقة الذهب', 0, 33.3152, 44.3661, 'مشترك نشط'),
  (gen_random_uuid(), 'سارة حسن كريم', '07702345678', NULL, 'sara@example.com', 'بغداد - المنصور', 'شارع الأميرات - منزل رقم 25', 'sara_h', 'باقة الفضة', -20000, 33.3128, 44.3615, 'متأخر في الدفع'),
  (gen_random_uuid(), 'خالد عبد الله', '07703456789', '07903456789', 'khaled@example.com', 'بغداد - الجادرية', 'مجمع السكني - بناية 5', 'khaled_a', 'باقة البلاتين', 50000, 33.2778, 44.3947, 'رصيد إيجابي'),
  (gen_random_uuid(), 'نور فاضل', '07704567890', NULL, 'noor@example.com', 'بغداد - الحارثية', 'شارع الربيع - منزل 12', 'noor_f', 'باقة البرونز', 0, 33.3386, 44.3949, 'مشترك جديد'),
  (gen_random_uuid(), 'محمود صالح', '07705678901', '07805678901', 'mahmoud@example.com', 'بغداد - اليرموك', 'حي المعلمين', 'mahmoud_s', 'باقة الأعمال', -40000, 33.3258, 44.3383, 'تم إيقاف الخدمة مؤقتاً'),
  (gen_random_uuid(), 'ليلى كمال', '07706789012', NULL, 'layla@example.com', 'بغداد - الزيونة', 'شارع السعدون', 'layla_k', 'باقة الذهب', 25000, 33.3072, 44.4430, 'مشترك نشط'),
  (gen_random_uuid(), 'عمر رشيد', '07707890123', '07907890123', 'omar@example.com', 'بغداد - الأعظمية', 'شارع عمر بن الخطاب', 'omar_r', 'باقة الفضة', 0, 33.3625, 44.3878, 'مشترك نشط'),
  (gen_random_uuid(), 'فاطمة جعفر', '07708901234', NULL, 'fatima@example.com', 'بغداد - الكاظمية', 'شارع الإمام الكاظم', 'fatima_j', 'باقة البرونز', -15000, 33.3822, 44.3422, 'متأخر في الدفع'),
  (gen_random_uuid(), 'علي جاسم', '07709012345', '07809012345', 'ali@example.com', 'بغداد - الدورة', 'حي العامل', 'ali_j', 'باقة البلاتين', 100000, 33.2333, 44.3578, 'رصيد إيجابي'),
  (gen_random_uuid(), 'زينب ناصر', '07700123456', NULL, 'zainab@example.com', 'بغداد - الشعلة', 'شارع الشعب', 'zainab_n', 'باقة الذهب', 0, 33.3694, 44.3286, 'مشترك نشط');

-- ===============================================
-- 5. Technicians (الفنيون)
-- ===============================================
INSERT INTO technicians (id, name, phone, specialization, available) VALUES
  (gen_random_uuid(), 'حسين علي', '07711111111', 'تركيب الكيبلات', true),
  (gen_random_uuid(), 'كريم حسن', '07722222222', 'صيانة الأجهزة', true),
  (gen_random_uuid(), 'رائد محمد', '07733333333', 'تركيب الراوترات', true),
  (gen_random_uuid(), 'باسم عادل', '07744444444', 'صيانة شبكات الألياف', false);

-- ===============================================
-- 6. Maintenance Tickets (تذاكر الصيانة)
-- ===============================================
INSERT INTO maintenance_tickets (subscriber_id, ticket_number, issue_description, priority, status, scheduled_date, notes)
SELECT 
  s.id,
  'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 0 THEN 'انقطاع الإنترنت بشكل كامل'
    WHEN 1 THEN 'بطء في سرعة الإنترنت'
    WHEN 2 THEN 'مشكلة في الراوتر'
    ELSE 'طلب فحص دوري'
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'high'::ticket_priority
    WHEN 1 THEN 'medium'::ticket_priority
    ELSE 'low'::ticket_priority
  END,
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 0 THEN 'open'::ticket_status
    WHEN 1 THEN 'in_progress'::ticket_status
    WHEN 2 THEN 'resolved'::ticket_status
    ELSE 'closed'::ticket_status
  END,
  NOW() + ((ROW_NUMBER() OVER()) || ' days')::INTERVAL,
  'تم تسجيل الطلب وجاري المتابعة'
FROM subscribers s
LIMIT 10;

-- ===============================================
-- 7. Invoices (الفواتير)
-- ===============================================
INSERT INTO invoices (subscriber_id, invoice_number, amount, discount, net_amount, status, issue_date, due_date)
SELECT 
  s.id,
  'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
  CASE s.plan
    WHEN 'باقة البرونز' THEN 25000
    WHEN 'باقة الفضة' THEN 40000
    WHEN 'باقة الذهب' THEN 60000
    WHEN 'باقة البلاتين' THEN 100000
    WHEN 'باقة الأعمال' THEN 200000
    ELSE 50000
  END,
  0,
  CASE s.plan
    WHEN 'باقة البرونز' THEN 25000
    WHEN 'باقة الفضة' THEN 40000
    WHEN 'باقة الذهب' THEN 60000
    WHEN 'باقة البلاتين' THEN 100000
    WHEN 'باقة الأعمال' THEN 200000
    ELSE 50000
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'paid'::invoice_status
    WHEN 1 THEN 'pending'::invoice_status
    ELSE 'overdue'::invoice_status
  END,
  CURRENT_DATE - 15,
  CURRENT_DATE + 15
FROM subscribers s;

-- ===============================================
-- 8. Payments (المدفوعات)
-- ===============================================
INSERT INTO payments (subscriber_id, invoice_id, amount, payment_method, payment_date, notes)
SELECT 
  i.subscriber_id,
  i.id,
  i.net_amount,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'cash'::payment_method
    WHEN 1 THEN 'bank_transfer'::payment_method
    ELSE 'qi_card'::payment_method
  END,
  CURRENT_DATE - (ROW_NUMBER() OVER() % 30),
  'دفعة شهرية'
FROM invoices i
WHERE i.status = 'paid'::invoice_status;

-- ===============================================
-- 9. Inventory (المخزون)
-- ===============================================
INSERT INTO inventory (item_name, item_code, category, quantity, unit, unit_price, min_stock_level, supplier, notes) VALUES
  ('راوتر TP-Link', 'RT-001', 'أجهزة', 50, 'قطعة', 45000, 10, 'شركة التقنية الحديثة', 'راوتر بسرعة 300 Mbps'),
  ('كابل شبكة Cat6', 'CB-001', 'كابلات', 500, 'متر', 1500, 100, 'مخازن النور', 'كابل بطول 1 متر'),
  ('موزع شبكة 8 منافذ', 'SW-001', 'أجهزة', 30, 'قطعة', 35000, 5, 'شركة الاتصالات', 'موزع جيجابت'),
  ('راوتر Mikrotik', 'RT-002', 'أجهزة', 20, 'قطعة', 120000, 5, 'شركة التقنية الحديثة', 'راوتر احترافي'),
  ('ألياف ضوئية', 'FB-001', 'كابلات', 1000, 'متر', 5000, 200, 'مخازن الألياف', 'ألياف بسرعة 1Gbps'),
  ('نقطة وصول WiFi', 'AP-001', 'أجهزة', 25, 'قطعة', 75000, 5, 'شركة الاتصالات', 'نقطة وصول داخلية'),
  ('موصلات RJ45', 'CN-001', 'مستلزمات', 1000, 'قطعة', 500, 100, 'مخازن النور', 'موصلات عالية الجودة'),
  ('صندوق توزيع', 'BX-001', 'مستلزمات', 40, 'قطعة', 15000, 10, 'مخازن النور', 'صندوق 12 منفذ');

-- ===============================================
-- 10. Exchange Rates (أسعار الصرف)
-- ===============================================
INSERT INTO exchange_rates (from_currency, to_currency, rate, effective_date) VALUES
  ('USD', 'IQD', 1310, CURRENT_DATE),
  ('IQD', 'USD', 0.000763, CURRENT_DATE),
  ('EUR', 'IQD', 1450, CURRENT_DATE),
  ('IQD', 'EUR', 0.000690, CURRENT_DATE);

-- ===============================================
-- 11. Vouchers (السندات)
-- ===============================================
INSERT INTO vouchers (voucher_number, voucher_type, account, amount, currency, description, expense_type) VALUES
  ('VCH-' || TO_CHAR(NOW(), 'YYYYMM') || '-0001', 'receipt', 'إيرادات الاشتراكات', 500000, 'IQD', 'تحصيل اشتراكات شهرية', NULL),
  ('VCH-' || TO_CHAR(NOW(), 'YYYYMM') || '-0002', 'payment', 'مصاريف الصيانة', 150000, 'IQD', 'صيانة دورية للشبكة', 'maintenance'),
  ('VCH-' || TO_CHAR(NOW(), 'YYYYMM') || '-0003', 'receipt', 'إيرادات التركيب', 200000, 'IQD', 'تركيب خطوط جديدة', NULL),
  ('VCH-' || TO_CHAR(NOW(), 'YYYYMM') || '-0004', 'payment', 'رواتب الموظفين', 2000000, 'IQD', 'رواتب شهر الحالي', 'salaries');

-- ===============================================
-- 12. Expense Vouchers (سندات الصرف)
-- ===============================================
INSERT INTO expense_vouchers (voucher_number, expense_type, category, amount, currency, paid_to, description, payment_method) VALUES
  ('EXP-' || TO_CHAR(NOW(), 'YYYYMM') || '-0001', 'operational', 'صيانة', 100000, 'IQD', 'مخازن قطع الغيار', 'شراء قطع غيار للصيانة', 'cash'),
  ('EXP-' || TO_CHAR(NOW(), 'YYYYMM') || '-0002', 'administrative', 'رواتب', 1500000, 'IQD', 'الموظفون', 'رواتب شهرية', 'bank_transfer'),
  ('EXP-' || TO_CHAR(NOW(), 'YYYYMM') || '-0003', 'operational', 'كهرباء', 250000, 'IQD', 'وزارة الكهرباء', 'فواتير كهرباء', 'bank_transfer');

-- ===============================================
-- 13. Geofence Zones (المناطق الجغرافية)
-- ===============================================
INSERT INTO geofence_zones (name, center_lat, center_lng, radius_meters, notify_on_enter, notify_on_exit, notification_message) VALUES
  ('منطقة المكتب الرئيسي', 33.3152, 44.3661, 500, true, true, 'دخول/خروج من منطقة المكتب'),
  ('منطقة الكرادة', 33.3128, 44.3615, 2000, true, false, 'دخول منطقة عمل الكرادة'),
  ('منطقة المنصور', 33.2778, 44.3947, 2000, true, false, 'دخول منطقة عمل المنصور');

-- ===============================================
-- 14. Complaints (الشكاوى)
-- ===============================================
INSERT INTO complaints (complaint_number, subscriber_id, subject, category, description, priority, status)
SELECT 
  'CMP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD((ROW_NUMBER() OVER())::TEXT, 4, '0'),
  s.id,
  CASE (ROW_NUMBER() OVER()) % 4
    WHEN 0 THEN 'انقطاع متكرر في الخدمة'
    WHEN 1 THEN 'بطء في السرعة'
    WHEN 2 THEN 'خطأ في الفاتورة'
    ELSE 'طلب تحسين الخدمة'
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'technical'
    WHEN 1 THEN 'billing'
    ELSE 'service'
  END,
  'تفاصيل الشكوى وتوضيح المشكلة',
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'high'
    WHEN 1 THEN 'medium'
    ELSE 'low'
  END,
  CASE (ROW_NUMBER() OVER()) % 3
    WHEN 0 THEN 'open'
    WHEN 1 THEN 'in_progress'
    ELSE 'resolved'
  END
FROM subscribers s
LIMIT 5;

-- ===============================================
-- Success Message
-- ===============================================
DO $$
BEGIN
  RAISE NOTICE '✅ تم إدخال البيانات التجريبية بنجاح!';
  RAISE NOTICE '📊 Statistics:';
  RAISE NOTICE '  - Subscribers: %', (SELECT COUNT(*) FROM subscribers);
  RAISE NOTICE '  - Invoices: %', (SELECT COUNT(*) FROM invoices);
  RAISE NOTICE '  - Payments: %', (SELECT COUNT(*) FROM payments);
  RAISE NOTICE '  - Tickets: %', (SELECT COUNT(*) FROM maintenance_tickets);
  RAISE NOTICE '  - Inventory Items: %', (SELECT COUNT(*) FROM inventory);
  RAISE NOTICE '  - Complaints: %', (SELECT COUNT(*) FROM complaints);
END $$;
