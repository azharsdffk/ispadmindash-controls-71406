# نظام إدارة وصيانة الإنترنت والمشتركين (ISP Management System)

## 📋 نظرة عامة
نظام إدارة شامل لمزودي خدمة الإنترنت (ISP) يتضمن إدارة المشتركين، تذاكر الصيانة، الفواتير، الموظفين، وتتبع المواقع.

## 🚀 المميزات الرئيسية

### ✅ إدارة المشتركين
- سحب بيانات المشتركين تلقائياً من SAS والمشروع الوطني
- عرض وتعديل بيانات المشتركين
- البحث السريع بالاسم، الهاتف، أو رقم الخدمة
- تتبع حالة المشترك والباقة

### ✅ نظام تذاكر الصيانة
- إنشاء تذاكر صيانة مع ملء بيانات المشترك تلقائياً
- تسجيل موقع GPS للفني عند إنشاء التذكرة
- تتبع حالة التذاكر (مفتوحة، قيد العمل، مغلقة)
- الأولويات (منخفضة، متوسطة، عالية، عاجلة)

### ✅ نظام الصلاحيات (RBAC)
- **Admin**: صلاحيات كاملة على النظام
- **Technician**: إنشاء تذاكر، عرض المشتركين المعينين
- **Accountant**: إدارة الفواتير والسندات
- **Client**: عرض بياناته فقط

### ✅ إدارة مالية
- إصدار فواتير بعملتين (IQD, USD)
- سندات القبض والمصروفات
- تقارير مالية

### ✅ تتبع الموظفين
- تتبع موقع GPS للموظفين
- إدارة أدوار وصلاحيات الموظفين
- سجل نشاطات الموظفين

## 🛠️ التقنيات المستخدمة

### الواجهة الأمامية
- **React 18** + **TypeScript**
- **Tailwind CSS** (دعم RTL كامل)
- **React Router** للتنقل
- **Lucide Icons** للأيقونات
- **Shadcn/ui** لمكونات الواجهة

### الواجهة الخلفية
- **Lovable Cloud** (Supabase)
  - قاعدة بيانات PostgreSQL
  - Authentication
  - Edge Functions
  - Real-time subscriptions
  - Row Level Security (RLS)

### مكتبات إضافية
- **Zod** للتحقق من البيانات
- **React Hook Form** للنماذج
- **Date-fns** لمعالجة التواريخ
- **Recharts** للرسوم البيانية

## 📦 التثبيت والإعداد

### 1. المتطلبات الأساسية
```bash
- Node.js 18+
- npm أو yarn أو bun
```

### 2. تثبيت المشروع
```bash
# استنساخ المشروع
git clone [repository-url]
cd isp-management-system

# تثبيت الحزم
npm install
```

### 3. إعداد متغيرات البيئة
ملف `.env` موجود بالفعل ويحتوي على:
```env
VITE_SUPABASE_URL=https://sxmkrmidebylykaefmsl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=sxmkrmidebylykaefmsl
```

**ملاحظة**: لا تعدل هذا الملف يدوياً - يتم تحديثه تلقائياً من Lovable Cloud.

### 4. تشغيل المشروع محلياً
```bash
npm run dev
```
سيعمل المشروع على: `http://localhost:5173`

## 🗄️ هيكل قاعدة البيانات

### الجداول الرئيسية

#### `subscribers` - المشتركين
```sql
- id: uuid (مفتاح أساسي)
- service_id: text (رقم الخدمة)
- name: text (الاسم)
- phone: text (الهاتف)
- address: text (العنوان)
- plan: text (الباقة)
- status: enum (active, inactive, suspended)
- created_at: timestamp
- updated_at: timestamp
```

#### `maintenance_tickets` - تذاكر الصيانة
```sql
- id: uuid
- ticket_number: text (رقم التذكرة)
- subscriber_id: uuid (مرجع للمشترك)
- issue_description: text (وصف المشكلة)
- priority: enum (low, medium, high, urgent)
- status: enum (open, in_progress, resolved, closed)
- assigned_to: uuid (الفني المعين)
- created_by: uuid
- notes: text (ملاحظات - يتضمن موقع GPS)
- created_at: timestamp
- updated_at: timestamp
```

#### `user_roles` - أدوار المستخدمين
```sql
- id: uuid
- user_id: uuid
- role: enum (admin, technician, accountant, client)
- created_at: timestamp
```

#### `invoices` - الفواتير
```sql
- id: uuid
- invoice_number: text
- subscriber_id: uuid
- amount: decimal
- currency: enum (IQD, USD)
- status: enum (draft, pending, paid, cancelled)
- issue_date: date
- due_date: date
- created_at: timestamp
```

### Row Level Security (RLS)

جميع الجداول محمية بسياسات RLS:

**Admin**: وصول كامل لجميع البيانات
```sql
CREATE POLICY "Admins have full access"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);
```

**Technician**: الوصول للمشتركين والتذاكر المعينة له
```sql
CREATE POLICY "Technicians see assigned data"
ON maintenance_tickets FOR SELECT
USING (
  assigned_to = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'technician'
  )
);
```

**Accountant**: الوصول للفواتير والسندات فقط
**Client**: الوصول لبياناته الخاصة فقط

## 🔐 نظام الصلاحيات

### تعيين دور لمستخدم جديد

#### من خلال الواجهة:
1. سجل دخول كـ Admin
2. اذهب إلى صفحة "إدارة الأدوار"
3. اختر المستخدم وعيّن الدور المناسب

#### باستخدام SQL:
```sql
-- تعيين دور admin
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');

-- تعيين دور technician
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'technician');
```

## 📱 استخدام النظام

### 1. تسجيل الدخول
- افتح التطبيق
- أدخل البريد الإلكتروني وكلمة المرور
- سيتم توجيهك للوحة التحكم

### 2. سحب بيانات مشترك
**من صفحة استيراد البيانات:**
1. اذهب إلى "استيراد البيانات"
2. اختر المصدر (SAS أو المشروع الوطني)
3. أدخل رقم الخدمة
4. اضغط "استيراد"

**من نموذج التذكرة (بحث سريع):**
1. افتح "فتح تذكرة صيانة"
2. اضغط "بحث سريع"
3. أدخل الاسم، الهاتف، أو رقم الخدمة
4. اختر المشترك من النتائج

### 3. إنشاء تذكرة صيانة
1. اذهب إلى صفحة "الصيانة"
2. اضغط "تذكرة جديدة"
3. **يتم ملء بيانات المشترك تلقائياً** بعد البحث
4. أدخل وصف المشكلة
5. اختر الأولوية
6. **يتم تسجيل موقع GPS تلقائياً**
7. اضغط "فتح التذكرة"

### 4. متابعة التذاكر
- **Admin**: يرى جميع التذاكر
- **Technician**: يرى تذاكره فقط
- يمكن تحديث حالة التذكرة
- إضافة ملاحظات

## 🔧 Edge Functions

### الدوال المتوفرة

#### `import-subscribers`
سحب بيانات المشتركين من المصادر الخارجية
```typescript
POST /functions/v1/import-subscribers
Body: {
  serviceId: string,
  source: 'sas' | 'national_project'
}
```

#### `track-pii-access`
تسجيل الوصول للبيانات الحساسة
```typescript
POST /functions/v1/track-pii-access
Body: {
  subscriberId: string,
  action: string,
  details: object
}
```

## 📊 التقارير

النظام يوفر تقارير شاملة:
- تقارير المشتركين (حسب الحالة، الباقة)
- تقارير التذاكر (حسب الحالة، الأولوية، الفني)
- تقارير مالية (إيرادات، مصروفات)
- تقارير الموظفين (أداء، مواقع)

## 🔒 الأمان

### حماية البيانات
- ✅ جميع الجداول محمية بـ RLS
- ✅ التحقق من الصلاحيات على مستوى الصف
- ✅ تسجيل جميع العمليات الحساسة
- ✅ تشفير البيانات الحساسة

### أفضل الممارسات
- لا تشارك مفاتيح API
- لا تستخدم scraping بدون تصريح
- راجع سياسات RLS بانتظام
- فعّل المصادقة الثنائية للمسؤولين

## 🧪 الاختبار

### بيانات تجريبية
استخدم السكريبت في `docs/seed-data.sql` لإدخال بيانات تجريبية:

```bash
# تنفيذ السكريبت عبر Lovable Backend
```

### اختبارات القبول

**✅ Test 1: تسجيل دخول Admin**
```
1. سجل دخول كـ admin@example.com
2. تحقق من الوصول لجميع الصفحات
3. تحقق من رؤية جميع المشتركين والتذاكر
```

**✅ Test 2: تسجيل دخول Technician**
```
1. سجل دخول كـ technician@example.com
2. تحقق من رؤية التذاكر المعينة فقط
3. جرب إنشاء تذكرة جديدة
4. تحقق من تسجيل موقع GPS
```

**✅ Test 3: إنشاء تذكرة**
```
1. افتح صفحة الصيانة
2. اضغط "تذكرة جديدة"
3. استخدم البحث السريع للعثور على مشترك
4. تحقق من ملء البيانات تلقائياً
5. أدخل وصف المشكلة
6. تحقق من تسجيل موقع GPS
7. احفظ التذكرة
```

**✅ Test 4: سحب بيانات مشترك**
```
1. اذهب لصفحة "استيراد البيانات"
2. اختر مصدر (SAS/المشروع الوطني)
3. أدخل رقم خدمة صحيح
4. تحقق من استيراد البيانات بنجاح
5. تحقق من حفظ البيانات في جدول subscribers
```

## 📝 ملاحظات مهمة

### استيراد البيانات
- الاستيراد من SAS والمشروع الوطني يتطلب API صحيحة
- إذا لم تتوفر API، النظام يستخدم بيانات وهمية للاختبار
- **تحذير**: استخدام Scraping يتطلب تصريح من المصدر

### موقع GPS
- يتطلب منح صلاحية الموقع من المتصفح
- يتم تسجيل الموقع تلقائياً عند إنشاء التذكرة
- الموقع يُخزن في حقل `notes` بالتذكرة

### العملات
- النظام يدعم IQD و USD
- يمكن ضبط العملة الافتراضية من الإعدادات
- سعر الصرف يُدخل يدوياً

## 🚀 النشر

راجع ملف `DEPLOYMENT_GUIDE.md` للتعليمات الكاملة.

### نشر سريع على Lovable
المشروع يعمل على Lovable Cloud - النشر تلقائي!

## 🐛 المشاكل الشائعة

### خطأ "ليس لديك صلاحية"
- تأكد من تعيين الدور الصحيح للمستخدم
- راجع جدول `user_roles`
- تحقق من سياسات RLS

### لا يعمل موقع GPS
- امنح صلاحية الموقع للمتصفح
- تأكد من دعم المتصفح للـ Geolocation API
- جرب من HTTPS فقط

### فشل استيراد البيانات
- تحقق من صحة رقم الخدمة
- تأكد من توفر اتصال بالإنترنت
- راجع console للأخطاء

## 📞 الدعم

لأي استفسارات أو مشاكل:
- راجع ملف `SUPPORT_NOTES.md`
- راجع ملف `DEPLOYMENT_GUIDE.md`

## 📄 الترخيص

هذا المشروع لأغراض تعليمية وتجارية.

---

**تم البناء بـ ❤️ باستخدام Lovable Cloud + React + TypeScript**
