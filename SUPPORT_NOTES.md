# ملاحظات الدعم الفني - ISP Management System

## 🔧 الأماكن التي قد تحتاج تعديل

### 1. استيراد البيانات من SAS

#### الملف: `src/services/importers/sas.ts`

**المطلوب تعديله:**
```typescript
// السطر 10-15: API Endpoints
const SAS_API_BASE = 'https://api.sas.example.com'; // ⚠️ عدّل هذا
const SAS_API_KEY = 'your-api-key'; // ⚠️ عدّل هذا

// أو إذا كنت تستخدم scraping:
const SAS_WEBSITE = 'https://sas.iq'; // ⚠️ عدّل هذا
```

**Scraper Selectors (إذا استخدمت Scraping):**
```typescript
// السطر 45-60: CSS Selectors
const SELECTORS = {
  name: '.subscriber-name',        // ⚠️ عدّل حسب الموقع
  phone: '.subscriber-phone',      // ⚠️ عدّل حسب الموقع
  address: '.subscriber-address',  // ⚠️ عدّل حسب الموقع
  plan: '.subscriber-plan',        // ⚠️ عدّل حسب الموقع
  status: '.subscriber-status'     // ⚠️ عدّل حسب الموقع
};
```

**كيفية إيجاد Selectors:**
1. افتح موقع SAS في المتصفح
2. اضغط F12 لفتح Developer Tools
3. اضغط على أداة Select Element (Ctrl+Shift+C)
4. اضغط على العنصر المراد
5. انسخ CSS Selector من الـ console

**مثال:**
```html
<!-- إذا كان HTML كالتالي: -->
<div class="user-info">
  <span class="name">أحمد محمد</span>
  <span class="phone">07701234567</span>
</div>

<!-- Selectors تكون: -->
name: '.user-info .name'
phone: '.user-info .phone'
```

### 2. استيراد البيانات من المشروع الوطني

#### الملف: `src/services/importers/nationalProject.ts`

**نفس التعديلات المطلوبة كـ SAS:**
```typescript
// API Configuration
const NP_API_BASE = 'https://api.national-project.gov.iq'; // ⚠️ عدّل
const NP_API_KEY = 'your-api-key'; // ⚠️ عدّل

// Website (for scraping fallback)
const NP_WEBSITE = 'https://national-project.gov.iq'; // ⚠️ عدّل

// Selectors
const SELECTORS = {
  // ⚠️ عدّل جميع الـ selectors
};
```

### 3. Edge Functions - استيراد المشتركين

#### الملف: `supabase/functions/import-subscribers/index.ts`

**تعديل API Endpoints:**
```typescript
// السطر 20-30
const API_CONFIGS = {
  sas: {
    baseUrl: Deno.env.get('SAS_API_URL') || 'https://api.sas.example.com',
    apiKey: Deno.env.get('SAS_API_KEY')
  },
  national_project: {
    baseUrl: Deno.env.get('NP_API_URL') || 'https://api.national-project.gov.iq',
    apiKey: Deno.env.get('NP_API_KEY')
  }
};
```

**ضبط Environment Variables:**
```bash
# في Lovable Backend → Settings → Environment Variables
SAS_API_URL=https://your-real-sas-api.com
SAS_API_KEY=your-real-api-key
NP_API_URL=https://your-real-np-api.com
NP_API_KEY=your-real-api-key
```

### 4. تنسيق البيانات

#### تنسيق رقم الهاتف
```typescript
// الملف: src/utils/phoneFormatter.ts (أنشئه إذا لم يكن موجوداً)

export function formatIraqiPhone(phone: string): string {
  // إزالة المسافات والرموز
  const cleaned = phone.replace(/\D/g, '');
  
  // التنسيق: 07XX-XXX-XXXX
  if (cleaned.startsWith('964')) {
    return cleaned.replace(/^964(\d{3})(\d{3})(\d{4})/, '0$1-$2-$3');
  }
  if (cleaned.startsWith('0')) {
    return cleaned.replace(/^0(\d{3})(\d{3})(\d{4})/, '0$1-$2-$3');
  }
  
  return phone; // إرجاع كما هو إذا لم يتطابق
}
```

### 5. سعر الصرف

#### الملف: `src/lib/currency.ts`

```typescript
// السطر 5-10
export const EXCHANGE_RATES = {
  IQD_TO_USD: 0.00068,  // ⚠️ حدّث هذا بانتظام
  USD_TO_IQD: 1470      // ⚠️ حدّث هذا بانتظام
};

// أو اجلبه من API
export async function getExchangeRate() {
  // يمكن استخدام API مثل:
  // https://api.exchangerate-api.com/v4/latest/USD
  const response = await fetch('https://api.example.com/rates');
  const data = await response.json();
  return data.IQD;
}
```

### 6. موقع GPS - الدقة

#### الملف: `src/components/modals/MaintenanceTicketModal.tsx`

```typescript
// السطر 50-66: ضبط دقة GPS
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy  // ⚠️ أضف هذا
        });
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,  // ⚠️ دقة عالية
        timeout: 10000,           // ⚠️ 10 ثوانٍ
        maximumAge: 0             // ⚠️ لا تستخدم cache
      }
    );
  }
};
```

### 7. الإشعارات (FCM)

**⚠️ حالياً: الإشعارات غير مفعّلة**

**لتفعيلها:**

#### الخطوة 1: إعداد FCM
```bash
# 1. اذهب إلى Firebase Console
# 2. أنشئ مشروع جديد
# 3. اذهب إلى Project Settings → Cloud Messaging
# 4. انسخ Server Key و Sender ID
```

#### الخطوة 2: إضافة المتغيرات
```env
# في .env
VITE_FCM_SENDER_ID=your-sender-id
VITE_FCM_VAPID_KEY=your-vapid-key
```

#### الخطوة 3: تفعيل Service Worker
```typescript
// الملف: public/firebase-messaging-sw.js (أنشئه)

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  projectId: "your-project-id",
  messagingSenderId: "your-sender-id"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

#### الخطوة 4: طلب إذن الإشعارات
```typescript
// الملف: src/hooks/useNotifications.ts

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

export const useNotifications = () => {
  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const messaging = getMessaging();
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_FCM_VAPID_KEY
        });
        
        // احفظ Token في قاعدة البيانات
        await saveTokenToDatabase(token);
      }
    };
    
    requestPermission();
  }, []);
};
```

### 8. Audit Logs - سجل التدقيق

**⚠️ لتفعيل تسجيل جميع العمليات:**

#### إنشاء جدول audit_logs
```sql
-- نفّذ في Lovable Backend

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index للأداء
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسة: Admin فقط يرى السجلات
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
```

#### دالة تسجيل تلقائي
```sql
-- دالة لتسجيل التغييرات تلقائياً

CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  )
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تطبيق على الجداول المهمة
CREATE TRIGGER subscribers_audit
AFTER INSERT OR UPDATE OR DELETE ON subscribers
FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER tickets_audit
AFTER INSERT OR UPDATE OR DELETE ON maintenance_tickets
FOR EACH ROW EXECUTE FUNCTION log_changes();

CREATE TRIGGER invoices_audit
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION log_changes();
```

### 9. التقارير والإحصائيات

#### إضافة تقارير مخصصة

```typescript
// الملف: src/pages/Reports.tsx (أنشئه إذا لم يكن موجوداً)

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const Reports = () => {
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    openTickets: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      // إجمالي المشتركين
      const { count: totalSubscribers } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true });

      // المشتركين النشطين
      const { count: activeSubscribers } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // التذاكر المفتوحة
      const { count: openTickets } = await supabase
        .from('maintenance_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // الإيرادات الشهرية
      const { data: invoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('created_at', new Date(new Date().setDate(1)).toISOString());

      const monthlyRevenue = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

      setStats({
        totalSubscribers: totalSubscribers || 0,
        activeSubscribers: activeSubscribers || 0,
        openTickets: openTickets || 0,
        monthlyRevenue
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-6">التقارير</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg">
          <h3 className="text-muted-foreground">إجمالي المشتركين</h3>
          <p className="text-3xl font-bold">{stats.totalSubscribers}</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg">
          <h3 className="text-muted-foreground">المشتركين النشطين</h3>
          <p className="text-3xl font-bold text-green-500">{stats.activeSubscribers}</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg">
          <h3 className="text-muted-foreground">التذاكر المفتوحة</h3>
          <p className="text-3xl font-bold text-orange-500">{stats.openTickets}</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg">
          <h3 className="text-muted-foreground">الإيرادات الشهرية</h3>
          <p className="text-3xl font-bold text-blue-500">
            {stats.monthlyRevenue.toLocaleString()} IQD
          </p>
        </div>
      </div>
    </div>
  );
};
```

## 🐛 المشاكل الشائعة والحلول

### مشكلة 1: "Failed to import subscriber"

**الأسباب المحتملة:**
1. API غير صحيح
2. رقم خدمة خاطئ
3. مشكلة في الاتصال

**الحل:**
```typescript
// أضف logging مفصّل في importers
console.log('Attempting to import:', serviceId, source);
console.log('API Response:', response);
console.log('Parsed Data:', data);
```

### مشكلة 2: "GPS Location not available"

**الأسباب:**
1. الموقع غير مفعّل في المتصفح
2. HTTP بدلاً من HTTPS
3. الصلاحيات مرفوضة

**الحل:**
```typescript
// إضافة رسالة توضيحية
if (!navigator.geolocation) {
  toast.error('المتصفح لا يدعم تحديد الموقع');
  return;
}

// طلب الصلاحية بشكل واضح
const permission = await navigator.permissions.query({ name: 'geolocation' });
if (permission.state === 'denied') {
  toast.error('يرجى تفعيل صلاحية الموقع من إعدادات المتصفح');
}
```

### مشكلة 3: "Permission denied" في RLS

**الحل:**
```sql
-- تحقق من السياسات
SELECT * FROM pg_policies WHERE tablename = 'subscribers';

-- تحقق من دور المستخدم
SELECT * FROM user_roles WHERE user_id = 'user-uuid';

-- اختبر السياسة
SET ROLE authenticated;
SELECT * FROM subscribers; -- يجب أن يعمل حسب الصلاحيات
```

## 📞 للمساعدة

إذا واجهت مشكلة غير مذكورة:
1. راجع console.log في المتصفح
2. راجع Logs في Lovable Backend
3. راجع `README_AR.md`

---

**نتمنى لك تجربة سلسة! 💪**
