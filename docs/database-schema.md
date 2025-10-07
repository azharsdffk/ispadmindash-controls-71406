# هيكل قاعدة البيانات - ISP Management System

## 📊 نظرة عامة على الجداول

قاعدة البيانات تحتوي على الجداول التالية:

1. **subscribers** - بيانات المشتركين
2. **maintenance_tickets** - تذاكر الصيانة
3. **invoices** - الفواتير
4. **receipts** - سندات القبض
5. **expenses** - المصروفات
6. **user_roles** - أدوار المستخدمين
7. **permissions** - الصلاحيات
8. **role_permissions** - ربط الأدوار بالصلاحيات
9. **employees** - بيانات الموظفين
10. **plans** - خطط الاشتراك
11. **settings** - إعدادات النظام
12. **audit_logs** - سجل التدقيق (اختياري)

---

## 📋 تفاصيل الجداول

### 1. subscribers - المشتركين

**الوصف**: يحتوي على بيانات جميع المشتركين في النظام.

```sql
CREATE TABLE subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id TEXT UNIQUE NOT NULL,          -- رقم الخدمة (من SAS أو المشروع الوطني)
  name TEXT NOT NULL,                       -- اسم المشترك
  phone TEXT NOT NULL,                      -- رقم الهاتف
  email TEXT,                               -- البريد الإلكتروني (اختياري)
  address TEXT,                             -- العنوان
  plan TEXT,                                -- الباقة الحالية
  status TEXT DEFAULT 'active',             -- الحالة: active, inactive, suspended
  balance DECIMAL DEFAULT 0,                -- الرصيد (+ رصيد، - دين)
  notes TEXT,                               -- ملاحظات
  assigned_technician UUID,                 -- الفني المعيّن
  
  -- بيانات إضافية من المصادر الخارجية
  source TEXT,                              -- المصدر: sas, national_project
  external_data JSONB,                      -- بيانات إضافية من API
  
  -- تواريخ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes للأداء
CREATE INDEX idx_subscribers_service_id ON subscribers(service_id);
CREATE INDEX idx_subscribers_phone ON subscribers(phone);
CREATE INDEX idx_subscribers_status ON subscribers(status);
CREATE INDEX idx_subscribers_assigned ON subscribers(assigned_technician);
```

**مثال بيانات:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "service_id": "SAS-12345",
  "name": "أحمد محمد علي",
  "phone": "07701234567",
  "email": "ahmed@example.com",
  "address": "بغداد - الكرادة - شارع 52",
  "plan": "50 ميجا",
  "status": "active",
  "balance": 0,
  "notes": "مشترك منتظم",
  "assigned_technician": "uuid-tech-1",
  "source": "sas",
  "external_data": {
    "original_address": "Baghdad, Karrada",
    "installation_date": "2023-01-15"
  },
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z"
}
```

---

### 2. maintenance_tickets - تذاكر الصيانة

**الوصف**: تذاكر الصيانة والشكاوى من المشتركين.

```sql
CREATE TABLE maintenance_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,       -- رقم التذكرة (TKT-202501-000001)
  
  -- معلومات المشترك
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE,
  
  -- تفاصيل المشكلة
  issue_description TEXT NOT NULL,          -- وصف المشكلة
  priority TEXT DEFAULT 'medium',           -- low, medium, high, urgent
  status TEXT DEFAULT 'open',               -- open, in_progress, resolved, closed
  
  -- التعيين
  assigned_to UUID,                         -- الفني المعيّن (references auth.users)
  created_by UUID,                          -- من أنشأ التذكرة
  
  -- ملاحظات ومتابعة
  notes TEXT,                               -- ملاحظات (تتضمن موقع GPS)
  resolution_notes TEXT,                    -- ملاحظات الحل
  
  -- تواريخ
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX idx_tickets_subscriber ON maintenance_tickets(subscriber_id);
CREATE INDEX idx_tickets_assigned ON maintenance_tickets(assigned_to);
CREATE INDEX idx_tickets_status ON maintenance_tickets(status);
CREATE INDEX idx_tickets_priority ON maintenance_tickets(priority);
CREATE INDEX idx_tickets_created_at ON maintenance_tickets(created_at);
```

**مثال بيانات:**
```json
{
  "id": "650e8400-e29b-41d4-a716-446655440000",
  "ticket_number": "TKT-202501-000045",
  "subscriber_id": "550e8400-e29b-41d4-a716-446655440000",
  "issue_description": "انقطاع متكرر في الخدمة - يحتاج فحص الكيبل الرئيسي",
  "priority": "high",
  "status": "in_progress",
  "assigned_to": "tech-uuid-1",
  "created_by": "admin-uuid-1",
  "notes": "موقع الفني عند الإنشاء: 33.3152, 44.3661\nتم الاتصال بالمشترك في 2024-01-15",
  "resolution_notes": null,
  "created_at": "2024-01-15T09:30:00Z",
  "updated_at": "2024-01-15T10:00:00Z",
  "resolved_at": null,
  "closed_at": null
}
```

---

### 3. invoices - الفواتير

**الوصف**: فواتير الاشتراكات والخدمات.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,      -- رقم الفاتورة
  
  -- معلومات المشترك
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE SET NULL,
  
  -- المبالغ
  amount DECIMAL NOT NULL,                  -- المبلغ
  currency TEXT DEFAULT 'IQD',              -- IQD, USD
  
  -- الحالة
  status TEXT DEFAULT 'pending',            -- draft, pending, paid, cancelled, overdue
  
  -- التواريخ
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  
  -- التفاصيل
  description TEXT,                         -- وصف الفاتورة
  items JSONB,                              -- بنود الفاتورة
  
  -- معلومات إضافية
  notes TEXT,
  created_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_subscriber ON invoices(subscriber_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

**مثال بيانات:**
```json
{
  "id": "750e8400-e29b-41d4-a716-446655440000",
  "invoice_number": "INV-202501-000123",
  "subscriber_id": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 100000,
  "currency": "IQD",
  "status": "paid",
  "issue_date": "2024-01-01",
  "due_date": "2024-01-31",
  "paid_date": "2024-01-15",
  "description": "فاتورة اشتراك شهري - باقة 50 ميجا",
  "items": [
    {
      "description": "اشتراك شهري",
      "amount": 100000
    }
  ],
  "notes": "دفعت كاملة",
  "created_by": "admin-uuid",
  "created_at": "2024-01-01T08:00:00Z",
  "updated_at": "2024-01-15T12:00:00Z"
}
```

---

### 4. receipts - سندات القبض

**الوصف**: سندات قبض المدفوعات من المشتركين.

```sql
CREATE TABLE receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT UNIQUE NOT NULL,      -- رقم السند
  
  -- معلومات المشترك
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE SET NULL,
  
  -- المبلغ
  amount DECIMAL NOT NULL,
  currency TEXT DEFAULT 'IQD',
  
  -- طريقة الدفع
  payment_method TEXT DEFAULT 'cash',       -- cash, bank_transfer, card, online
  
  -- ربط بالفاتورة
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  
  -- تفاصيل
  notes TEXT,
  received_by UUID,                         -- من استلم المبلغ
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_receipts_subscriber ON receipts(subscriber_id);
CREATE INDEX idx_receipts_invoice ON receipts(invoice_id);
CREATE INDEX idx_receipts_created_at ON receipts(created_at);
```

---

### 5. user_roles - أدوار المستخدمين

**الوصف**: ربط المستخدمين بأدوارهم.

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,                    -- references auth.users
  role TEXT NOT NULL,                       -- admin, technician, accountant, client
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, role)
);

-- Indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);
```

**الأدوار المتاحة:**
- **admin**: صلاحيات كاملة
- **technician**: إنشاء تذاكر، عرض المشتركين المعيّنين
- **accountant**: إدارة الفواتير والمالية
- **client**: عرض بياناته فقط

---

### 6. permissions - الصلاحيات

**الوصف**: قائمة الصلاحيات في النظام.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                -- مثل: view_subscribers
  description TEXT,                         -- وصف الصلاحية
  category TEXT,                            -- تصنيف: subscribers, tickets, invoices, etc
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**أمثلة صلاحيات:**
```
view_subscribers, create_subscribers, edit_subscribers, delete_subscribers
view_tickets, create_tickets, edit_tickets, close_tickets
view_invoices, create_invoices, edit_invoices, cancel_invoices
view_reports, export_reports
manage_employees, manage_roles, manage_settings
```

---

### 7. role_permissions - ربط الأدوار بالصلاحيات

```sql
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,                       -- admin, technician, etc
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(role, permission_id)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
```

---

### 8. employees - الموظفين

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,                      -- references auth.users (اختياري)
  
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  
  position TEXT,                            -- المنصب
  status TEXT DEFAULT 'active',             -- active, inactive, on_leave
  
  salary DECIMAL,
  hire_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_status ON employees(status);
```

---

### 9. plans - خطط الاشتراك

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,                -- اسم الباقة
  speed TEXT,                               -- السرعة (مثل: 50 ميجا)
  price_iqd DECIMAL NOT NULL,               -- السعر بالدينار
  price_usd DECIMAL,                        -- السعر بالدولار (اختياري)
  description TEXT,
  features JSONB,                           -- مزايا الباقة
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

### 10. settings - الإعدادات

```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,                 -- مفتاح الإعداد
  value TEXT NOT NULL,                      -- القيمة
  description TEXT,                         -- الوصف
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**إعدادات مهمة:**
```
company_name, company_phone, company_email, company_address
default_currency, exchange_rate_usd_to_iqd
invoice_prefix, receipt_prefix, ticket_prefix
sas_api_url, np_api_url
```

---

### 11. audit_logs - سجل التدقيق (اختياري)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,                             -- من قام بالعملية
  action TEXT NOT NULL,                     -- INSERT, UPDATE, DELETE
  table_name TEXT NOT NULL,                 -- اسم الجدول
  record_id UUID,                           -- ID السجل
  old_data JSONB,                           -- البيانات القديمة
  new_data JSONB,                           -- البيانات الجديدة
  ip_address TEXT,                          -- عنوان IP
  user_agent TEXT,                          -- المتصفح
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

## 🔐 Row Level Security (RLS)

جميع الجداول محمية بسياسات RLS. مثال:

```sql
-- Enable RLS
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Admin: كل شيء
CREATE POLICY "Admins have full access"
ON subscribers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Technician: المشتركين المعيّنين له فقط
CREATE POLICY "Technicians see assigned subscribers"
ON subscribers FOR SELECT
USING (
  assigned_technician = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'technician'
  )
);
```

---

## 📊 العلاقات بين الجداول

```
auth.users (Supabase Auth)
    |
    +-- user_roles --> role_permissions --> permissions
    |
    +-- employees
    |
    +-- subscribers
            |
            +-- maintenance_tickets
            |
            +-- invoices --> receipts
```

---

## 🔍 Queries شائعة

### 1. احصل على جميع تذاكر مشترك معين
```sql
SELECT * FROM maintenance_tickets
WHERE subscriber_id = 'uuid-here'
ORDER BY created_at DESC;
```

### 2. احصل على جميع الفواتير المتأخرة
```sql
SELECT * FROM invoices
WHERE status = 'pending'
AND due_date < CURRENT_DATE
ORDER BY due_date ASC;
```

### 3. احصل على صلاحيات مستخدم
```sql
SELECT p.name
FROM permissions p
JOIN role_permissions rp ON p.id = rp.permission_id
JOIN user_roles ur ON rp.role = ur.role
WHERE ur.user_id = 'uuid-here';
```

---

**تم إنشاء هذا الملف لتوثيق هيكل قاعدة البيانات الكامل.**
