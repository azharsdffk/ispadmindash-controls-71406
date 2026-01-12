# دليل إعداد Tauri لتطبيق سطح المكتب 🖥️

## المتطلبات الأساسية

### 1. تثبيت Rust
```bash
# Windows - قم بتحميل وتشغيل:
https://win.rustup.rs/x86_64
```

### 2. تثبيت Visual Studio Build Tools
- حمّل من: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- اختر "Desktop development with C++"

### 3. تثبيت Node.js
- حمّل من: https://nodejs.org (LTS version)

---

## خطوات الإعداد

### الخطوة 1: تصدير المشروع
1. في Lovable، اضغط على **GitHub** → **Connect to GitHub**
2. اضغط **Create Repository**
3. انتظر حتى يتم إنشاء المستودع

### الخطوة 2: استنساخ المشروع
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### الخطوة 3: تثبيت Tauri
```bash
npm install -D @tauri-apps/cli@latest @tauri-apps/api@latest
```

### الخطوة 4: تهيئة Tauri
```bash
npx tauri init
```

**الإجابات المطلوبة:**
- App name: `ISP Admin Dashboard`
- Window title: `لوحة تحكم ISP`
- Dev server URL: `http://localhost:5173`
- Build command: `npm run build`
- Output directory: `dist`

### الخطوة 5: تعديل package.json
أضف هذه الأوامر في قسم `scripts`:
```json
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

---

## تشغيل التطبيق

### وضع التطوير
```bash
# Terminal 1 - تشغيل خادم التطوير
npm run dev

# Terminal 2 - تشغيل Tauri
npm run tauri:dev
```

### بناء ملف EXE
```bash
npm run tauri:build
```

📁 **مكان الملف:** `src-tauri/target/release/bundle/msi/`

---

## تخصيص التطبيق

### تغيير الأيقونة
1. ضع أيقونتك في `src-tauri/icons/`
2. الأحجام المطلوبة:
   - `32x32.png`
   - `128x128.png`
   - `128x128@2x.png`
   - `icon.ico` (لويندوز)

### إعدادات النافذة
عدّل `src-tauri/tauri.conf.json`:
```json
{
  "tauri": {
    "windows": [
      {
        "title": "لوحة تحكم ISP",
        "width": 1400,
        "height": 900,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ]
  }
}
```

---

## حل المشاكل الشائعة

### خطأ: Rust not found
```bash
rustup update
```

### خطأ: Build tools missing
- تأكد من تثبيت Visual Studio Build Tools
- أعد تشغيل الكمبيوتر بعد التثبيت

### خطأ: WebView2 missing
- حمّل WebView2 Runtime من Microsoft

---

## روابط مفيدة

- [توثيق Tauri الرسمي](https://tauri.app/v1/guides/)
- [Tauri API](https://tauri.app/v1/api/js/)
- [أمثلة Tauri](https://github.com/tauri-apps/tauri/tree/dev/examples)

---

## ملاحظات هامة

⚠️ **تحذير:** عند تشغيل التطبيق كـ desktop app:
- تأكد من أن الخادم الخلفي (Supabase) متاح
- قد تحتاج لتعديل CORS settings
- اختبر جميع الميزات قبل التوزيع

✅ **نصيحة:** ابدأ بـ `tauri dev` للتأكد من عمل كل شيء قبل البناء النهائي
