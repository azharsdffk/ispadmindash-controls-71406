# إعداد التطبيق على الأجهزة المحمولة

## نظرة عامة
يدعم هذا المشروع تشغيله كتطبيق موبايل أصلي على iOS و Android باستخدام Capacitor.

## المتطلبات الأساسية

### لنظام iOS:
- جهاز Mac مع macOS 12.0 أو أحدث
- Xcode 14 أو أحدث
- CocoaPods مثبت
- حساب Apple Developer (للنشر على App Store)

### لنظام Android:
- Android Studio مثبت
- Java Development Kit (JDK) 17
- Android SDK Platform 33 أو أحدث
- Gradle 7.5+

## خطوات الإعداد

### 1. تثبيت الاعتماديات
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npm install @capacitor/geolocation @capacitor/push-notifications
npm install @capacitor/status-bar @capacitor/app @capacitor/preferences
```

### 2. تهيئة Capacitor
```bash
npx cap init
```

سيطلب منك:
- **App ID**: `app.lovable.e6141b7da52847dbb95c81f2feeeabf2`
- **App Name**: `ispadmindash-controls-71406`

### 3. إضافة المنصات
```bash
# لإضافة Android
npx cap add android

# لإضافة iOS
npx cap add ios
```

### 4. بناء المشروع
```bash
npm run build
npx cap sync
```

### 5. فتح المشروع الأصلي

#### لـ Android:
```bash
npx cap open android
```
سيفتح Android Studio. من هناك يمكنك:
- توصيل جهاز Android عبر USB مع تفعيل USB Debugging
- أو استخدام محاكي Android
- اضغط زر Run لتشغيل التطبيق

#### لـ iOS:
```bash
npx cap open ios
```
سيفتح Xcode. من هناك:
- حدد جهاز iOS متصل أو محاكي
- قم بتوقيع التطبيق بحساب Apple Developer الخاص بك
- اضغط Run

## الميزات المدمجة

### 1. تتبع الموقع الجغرافي (GPS)
- تتبع موقع الموظفين في الوقت الفعلي
- تسجيل الموقع عند إنشاء تذاكر الصيانة
- رصد دخول/خروج الموظفين من المناطق المحددة (Geofencing)

### 2. الإشعارات الفورية (Push Notifications)
- إشعارات بالتذاكر الجديدة
- تحديثات حالة الصيانة
- تنبيهات أمنية ومالية

### 3. التخزين المحلي
- حفظ إعدادات المستخدم محلياً
- التخزين الآمن للبيانات الحساسة

## التطوير مع Hot Reload

للتطوير السريع مع hot reload، قم بتحديث `capacitor.config.ts`:
```typescript
const config: CapacitorConfig = {
  appId: 'app.lovable.e6141b7da52847dbb95c81f2feeeabf2',
  appName: 'ispadmindash-controls-71406',
  webDir: 'dist',
  server: {
    url: 'https://e6141b7d-a528-47db-b95c-81f2feeeabf2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};
```

⚠️ **ملاحظة**: احذف أو عطّل `server.url` قبل النشر للإنتاج!

## الموارد المفيدة
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Lovable Mobile Development Blog](https://lovable.dev/blogs/mobile-development)
