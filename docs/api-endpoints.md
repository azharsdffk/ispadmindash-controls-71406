# API Endpoints - ISP Management System

## 🚀 Edge Functions (Lovable Cloud)

جميع Edge Functions متوفرة على:
```
Base URL: https://sxmkrmidebylykaefmsl.supabase.co/functions/v1/
```

---

## 1. استيراد مشترك

### `POST /import-subscribers`

**الوصف**: سحب بيانات مشترك من SAS أو المشروع الوطني وحفظها في قاعدة البيانات.

**Authentication**: Required (Bearer Token)

**Request:**
```json
{
  "serviceId": "SAS-12345",
  "source": "sas"  // أو "national_project"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "service_id": "SAS-12345",
    "name": "أحمد محمد",
    "phone": "07701234567",
    "address": "بغداد - الكرادة",
    "plan": "50 ميجا",
    "status": "active"
  },
  "message": "تم استيراد بيانات المشترك بنجاح"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "لم يتم العثور على المشترك",
  "code": "NOT_FOUND"
}
```

**cURL Example:**
```bash
curl -X POST \
  https://sxmkrmidebylykaefmsl.supabase.co/functions/v1/import-subscribers \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "SAS-12345",
    "source": "sas"
  }'
```

**أكواد الخطأ:**
- `UNAUTHORIZED`: المستخدم غير مصرح له
- `NOT_FOUND`: لم يتم العثور على المشترك
- `INVALID_SOURCE`: مصدر غير صحيح
- `API_ERROR`: خطأ في API الخارجي
- `DATABASE_ERROR`: خطأ في حفظ البيانات

---

## 2. تتبع الوصول للبيانات الحساسة

### `POST /track-pii-access`

**الوصف**: تسجيل الوصول للبيانات الحساسة (PII) للتدقيق والأمان.

**Authentication**: Required

**Request:**
```json
{
  "subscriberId": "uuid",
  "action": "view",  // view, edit, delete
  "details": {
    "page": "subscribers",
    "fields": ["phone", "address"],
    "reason": "customer support"
  }
}
```

**Response:**
```json
{
  "success": true,
  "logId": "uuid",
  "message": "تم تسجيل الوصول للبيانات"
}
```

**cURL Example:**
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

---

## 3. مساعد AI

### `POST /ai-assistant`

**الوصف**: الحصول على إجابات من مساعد AI للنظام.

**Authentication**: Required

**Request:**
```json
{
  "message": "كيف أنشئ تذكرة صيانة؟",
  "context": {
    "page": "maintenance",
    "userId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "لإنشاء تذكرة صيانة:\n1. اذهب إلى صفحة الصيانة\n2. اضغط 'تذكرة جديدة'\n...",
  "suggestions": [
    "كيف أسحب بيانات مشترك؟",
    "كيف أصدر فاتورة؟"
  ]
}
```

---

## 4. فحص Geofence

### `POST /check-geofence`

**الوصف**: التحقق من وجود الفني داخل منطقة جغرافية محددة.

**Authentication**: Required

**Request:**
```json
{
  "technicianId": "uuid",
  "location": {
    "lat": 33.3152,
    "lng": 44.3661
  },
  "geofence": {
    "center": {
      "lat": 33.3152,
      "lng": 44.3661
    },
    "radius": 500  // بالمتر
  }
}
```

**Response:**
```json
{
  "success": true,
  "inside": true,
  "distance": 234.5,  // بالمتر
  "message": "الفني داخل المنطقة المحددة"
}
```

---

## 5. إدارة أدوار المستخدمين

### `POST /manage-user-roles`

**الوصف**: تعيين أو تحديث دور مستخدم (Admin فقط).

**Authentication**: Required (Admin)

**Request:**
```json
{
  "userId": "uuid",
  "action": "add",  // add, remove
  "role": "technician"  // admin, technician, accountant, client
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تعيين الدور بنجاح",
  "roles": ["technician"]
}
```

---

## 6. طلب إعادة تعيين كلمة المرور

### `POST /password-reset-request`

**الوصف**: إرسال رابط إعادة تعيين كلمة المرور.

**Authentication**: Not Required

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال رابط إعادة التعيين للبريد الإلكتروني"
}
```

---

## 🔐 Authentication

جميع الطلبات (ما عدا password-reset-request) تتطلب Bearer Token:

```bash
Authorization: Bearer YOUR_USER_TOKEN
```

### الحصول على Token

```typescript
import { supabase } from '@/integrations/supabase/client';

// بعد تسجيل الدخول
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## ⚠️ Rate Limiting

- **Import Subscribers**: 10 requests/minute
- **Track PII**: 100 requests/minute
- **AI Assistant**: 5 requests/minute
- **Other endpoints**: 50 requests/minute

---

## 🧪 Testing

### سكربت اختبار سريع

```bash
#!/bin/bash

# ملف: test-api.sh

BASE_URL="https://sxmkrmidebylykaefmsl.supabase.co/functions/v1"
TOKEN="your-test-token-here"

echo "Testing Import Subscribers..."
curl -X POST "$BASE_URL/import-subscribers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"serviceId": "SAS-12345", "source": "sas"}' \
  | jq

echo ""
echo "Testing Track PII..."
curl -X POST "$BASE_URL/track-pii-access" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscriberId": "uuid", "action": "view", "details": {}}' \
  | jq

echo ""
echo "Testing AI Assistant..."
curl -X POST "$BASE_URL/ai-assistant" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "مرحبا"}' \
  | jq
```

**تشغيل:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📊 أكواد الحالة

- `200` - نجح الطلب
- `400` - خطأ في البيانات المرسلة
- `401` - غير مصرح (Unauthorized)
- `403` - ممنوع (Forbidden)
- `404` - غير موجود
- `429` - تجاوز حد الطلبات (Rate Limit)
- `500` - خطأ في الخادم

---

## 🔄 Webhooks (مستقبلاً)

سيتم إضافة webhooks لـ:
- إنشاء تذكرة جديدة
- تحديث حالة تذكرة
- دفع فاتورة
- إضافة مشترك جديد

---

**للمزيد من المعلومات، راجع `README_AR.md`**
