-- تعديل إعدادات الجلسات للسماح بتسجيل دخول متعدد افتراضياً
-- تغيير القيمة الافتراضية لـ allow_multiple_sessions إلى true
ALTER TABLE public.user_security_settings 
ALTER COLUMN allow_multiple_sessions SET DEFAULT true;

-- تحديث جميع السجلات الموجودة للسماح بجلسات متعددة
UPDATE public.user_security_settings 
SET allow_multiple_sessions = true 
WHERE allow_multiple_sessions = false;