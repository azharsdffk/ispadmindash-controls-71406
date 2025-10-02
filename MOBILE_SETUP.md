# 📱 دليل إعداد التطبيق على الموبايل

## متطلبات التشغيل

### لنظام Android:
- Android Studio مثبت
- Java JDK 17+
- Android SDK

### لنظام iOS:
- macOS مع Xcode مثبت
- CocoaPods مثبت
- Apple Developer Account

---

## خطوات التشغيل

### 1️⃣ نقل المشروع إلى GitHub

1. اضغط على زر **Export to GitHub** في Lovable
2. انسخ رابط المستودع
3. قم بعمل `git pull` للمشروع:

```bash
git clone [رابط المستودع]
cd [اسم المشروع]
```

### 2️⃣ تثبيت Dependencies

```bash
npm install
```

### 3️⃣ إضافة منصات الموبايل

**لنظام Android:**
```bash
npx cap add android
```

**لنظام iOS:**
```bash
npx cap add ios
```

### 4️⃣ بناء المشروع

```bash
npm run build
```

### 5️⃣ مزامنة الملفات

```bash
npx cap sync
```

### 6️⃣ تشغيل التطبيق

**Android:**
```bash
npx cap run android
```

**iOS:**
```bash
npx cap run ios
```

---

## ⚙️ إعدادات إضافية

### صلاحيات Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### صلاحيات iOS (ios/App/App/Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>نحتاج للوصول إلى موقعك لتتبع الموظفين</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>نحتاج للوصول إلى موقعك في الخلفية لتتبع الموظفين</string>
```

---

## 🔄 التحديثات المستقبلية

عند إضافة ميزات جديدة:

1. اسحب آخر التغييرات من GitHub:
```bash
git pull origin main
```

2. ثبت Dependencies الجديدة:
```bash
npm install
```

3. أعد البناء والمزامنة:
```bash
npm run build
npx cap sync
```

---

## 🎯 المميزات المدعومة

✅ **Authentication**: تسجيل دخول/خروج آمن  
✅ **GPS Tracking**: تتبع موقع الموظفين  
✅ **Push Notifications**: إشعارات فورية  
✅ **Secure Storage**: تخزين آمن للـ Tokens  
✅ **Auto Logout**: خروج تلقائي بعد الخمول  
✅ **RTL Support**: دعم كامل للعربية  
✅ **Offline Mode**: إمكانية العمل بدون إنترنت  

---

## 🐛 استكشاف الأخطاء

### مشكلة في البناء:
```bash
npm run build -- --debug
```

### مشكلة في المزامنة:
```bash
npx cap sync --force
```

### تنظيف الـ Cache:
```bash
rm -rf node_modules
npm install
npm run build
npx cap sync
```

---

## 📚 روابط مفيدة

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)
- [Push Notifications Plugin](https://capacitorjs.com/docs/apis/push-notifications)
- [Lovable Blog - Mobile Development](https://lovable.dev/blogs)

---

## 💡 ملاحظات مهمة

- التطبيق يعمل الآن في وضع **Hot Reload** من Lovable Sandbox
- لتشغيل التطبيق في Production، قم بتغيير `server.url` في `capacitor.config.ts` إلى رابط الـ Production
- تأكد من تحديث الـ Backend URL في ملفات Environment
