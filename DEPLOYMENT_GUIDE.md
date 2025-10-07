# دليل النشر - ISP Management System

## 🌐 نشر الواجهة الأمامية

### النشر على Lovable (موصى به)
المشروع يعمل بالفعل على Lovable Cloud - النشر تلقائي!
- كل تحديث في الكود يُنشر تلقائياً
- لا حاجة لخطوات إضافية

### النشر على Vercel

#### 1. إعداد المشروع
```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login
```

#### 2. ضبط المتغيرات
في Vercel Dashboard:
```
Settings → Environment Variables

إضافة:
VITE_SUPABASE_URL=https://sxmkrmidebylykaefmsl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[your-key]
VITE_SUPABASE_PROJECT_ID=sxmkrmidebylykaefmsl
```

#### 3. النشر
```bash
# من مجلد المشروع
vercel

# أو للإنتاج مباشرة
vercel --prod
```

#### 4. ضبط إعادة التوجيه
أنشئ ملف `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### النشر على Netlify

#### 1. إعداد المشروع
```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# تسجيل الدخول
netlify login
```

#### 2. إنشاء ملف `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 3. ضبط المتغيرات
في Netlify Dashboard:
```
Site settings → Environment variables

إضافة:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

#### 4. النشر
```bash
# بناء المشروع
npm run build

# النشر
netlify deploy --prod
```

## ⚡ نشر Edge Functions

### Edge Functions على Lovable Cloud
Edge Functions تُنشر تلقائياً!

الملفات في `supabase/functions/` تُنشر تلقائياً عند التحديث.

### التحقق من نشر الدوال
```bash
# عرض الدوال المنشورة
# لا حاجة لأوامر - كل شيء تلقائي على Lovable
```

### اختبار Edge Functions

#### استيراد مشترك
```bash
curl -X POST \
  https://sxmkrmidebylykaefmsl.supabase.co/functions/v1/import-subscribers \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "12345",
    "source": "sas"
  }'
```

#### تتبع PII
```bash
curl -X POST \
  https://sxmkrmidebylykaefmsl.supabase.co/functions/v1/track-pii-access \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriberId": "uuid-here",
    "action": "view",
    "details": {"page": "subscribers"}
  }'
```

## 🗄️ إعداد قاعدة البيانات

### قاعدة البيانات جاهزة!
قاعدة البيانات على Lovable Cloud جاهزة ومضبوطة.

### إضافة بيانات تجريبية

استخدم السكريبت في `docs/seed-data.sql`:

1. افتح Lovable Backend
2. اذهب إلى SQL Editor
3. الصق محتوى `seed-data.sql`
4. نفّذ السكريبت

أو استخدم Lovable Console:
```sql
-- سيتم تنفيذه من خلال أدوات Lovable
```

## 🔐 إعداد المصادقة

### تفعيل Email/Password
المصادقة مفعّلة بالفعل على Lovable Cloud.

### ضبط إعادة توجيه
في Lovable Backend:
```
Authentication → URL Configuration

Site URL: https://your-domain.com
Redirect URLs: 
  https://your-domain.com
  https://your-domain.com/auth/callback
```

## 📊 إعداد Row Level Security

### التحقق من السياسات
جميع السياسات منشورة! لعرضها:

1. افتح Lovable Backend
2. اذهب إلى Database
3. اختر جدول
4. Policies tab

### سياسات مهمة

#### Subscribers
```sql
-- Admin: وصول كامل ✅
-- Technician: عرض المعيّنين له ✅
-- Client: بياناته فقط ✅
```

#### Maintenance Tickets
```sql
-- Admin: كل التذاكر ✅
-- Technician: تذاكره فقط ✅
-- Client: تذاكره فقط ✅
```

#### Invoices
```sql
-- Admin: كل الفواتير ✅
-- Accountant: كل الفواتير ✅
-- Client: فواتيره فقط ✅
```

## 🔒 الأمان

### قائمة مراجعة الأمان

#### قبل النشر
- [ ] تحقق من سياسات RLS على جميع الجداول
- [ ] امنع الوصول العام للبيانات الحساسة
- [ ] فعّل تسجيل الأحداث
- [ ] راجع صلاحيات Edge Functions
- [ ] تحقق من صحة المتغيرات البيئية

#### بعد النشر
- [ ] اختبر الصلاحيات لكل دور
- [ ] تحقق من عمل RLS بشكل صحيح
- [ ] راجع السجلات (logs)
- [ ] اختبر سيناريوهات الأمان

### فحص أمني سريع

```bash
# اختبار الوصول بدون تسجيل دخول
curl https://your-domain.com/api/subscribers
# يجب أن يرجع 401

# اختبار الوصول بصلاحيات خاطئة
# (technician يحاول الوصول لبيانات admin)
# يجب أن يرجع 403
```

## 📱 تطبيق الموبايل (Capacitor)

### إعداد Android

```bash
# إضافة منصة Android
npx cap add android

# بناء الويب
npm run build

# نسخ الملفات
npx cap sync

# فتح Android Studio
npx cap open android
```

### إعداد iOS

```bash
# إضافة منصة iOS
npx cap add ios

# بناء الويب
npm run build

# نسخ الملفات
npx cap sync

# فتح Xcode
npx cap open ios
```

### ضبط الصلاحيات

#### Android - `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
```

#### iOS - `ios/App/App/Info.plist`
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>نحتاج موقعك لتسجيل موقع الفني عند إنشاء التذاكر</string>
```

## 🧪 اختبار بعد النشر

### 1. اختبار واجهة المستخدم
```bash
# افتح الموقع المنشور
https://your-domain.com

# اختبارات أساسية:
✅ تحميل الصفحة الرئيسية
✅ تسجيل الدخول
✅ عرض لوحة التحكم
✅ التنقل بين الصفحات
✅ إنشاء تذكرة
✅ عرض المشتركين
```

### 2. اختبار API
```bash
# ملف test-api.sh
#!/bin/bash

BASE_URL="https://your-domain.com"
TOKEN="your-test-token"

# Test 1: Get subscribers
curl -X GET "$BASE_URL/api/subscribers" \
  -H "Authorization: Bearer $TOKEN"

# Test 2: Create ticket
curl -X POST "$BASE_URL/api/tickets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriberId": "uuid",
    "issue": "test issue"
  }'
```

### 3. اختبار الصلاحيات
```bash
# اختبار صلاحيات Admin
# 1. سجل دخول كـ admin
# 2. تحقق من الوصول لجميع الصفحات

# اختبار صلاحيات Technician
# 1. سجل دخول كـ technician
# 2. تحقق من عدم رؤية بيانات غير مخصصة له

# اختبار صلاحيات Client
# 1. سجل دخول كـ client
# 2. تحقق من رؤية بياناته فقط
```

## 📊 المراقبة والسجلات

### مراقبة Lovable Cloud

1. افتح Lovable Backend
2. اذهب إلى Logs
3. راقب:
   - Errors
   - Performance
   - Database queries
   - Edge Function invocations

### مراقبة الأداء

```typescript
// في src/main.tsx - إضافة مراقبة
if (import.meta.env.PROD) {
  console.log('Production mode - monitoring enabled');
  
  // يمكن إضافة أدوات مثل Sentry
  // Sentry.init({ ... });
}
```

## 🔄 التحديثات والصيانة

### تحديث الكود
```bash
# سحب آخر التحديثات
git pull

# تحديث الحزم
npm update

# إعادة النشر
# (تلقائي على Lovable)
```

### النسخ الاحتياطي

#### نسخ قاعدة البيانات
```bash
# استخدم Lovable Backend
# Database → Backups → Create Backup
```

#### نسخ الملفات
```bash
# نسخ احتياطي للكود
git push origin main

# نسخ احتياطي للملفات المرفوعة
# (إذا كنت تستخدم Storage)
```

## ⚠️ استكشاف الأخطاء

### خطأ: "Failed to fetch"
```bash
# تحقق من:
1. CORS settings في Lovable
2. URL الصحيح
3. توفر الإنترنت
```

### خطأ: "Permission denied"
```bash
# تحقق من:
1. سياسات RLS
2. تسجيل الدخول
3. صلاحيات المستخدم
```

### خطأ: "Function not found"
```bash
# تحقق من:
1. نشر Edge Function
2. اسم الدالة الصحيح
3. السجلات (logs)
```

## 📞 الدعم

للمساعدة:
- راجع `README_AR.md`
- راجع `SUPPORT_NOTES.md`
- افتح Lovable Console
- تحقق من Logs

---

**نشر سعيد! 🚀**
