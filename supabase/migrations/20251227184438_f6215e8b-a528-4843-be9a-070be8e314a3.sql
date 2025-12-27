-- إضافة عمود push_token لجدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- إضافة عمود للإعدادات
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"push_enabled": true, "email_enabled": true, "sms_enabled": true}'::jsonb;

-- إنشاء جدول إعدادات الجدولة التلقائية
CREATE TABLE IF NOT EXISTS public.auto_billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT true,
  billing_day INTEGER DEFAULT 1 CHECK (billing_day >= 1 AND billing_day <= 28),
  advance_days INTEGER DEFAULT 5,
  auto_send_sms BOOLEAN DEFAULT true,
  auto_send_email BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تفعيل RLS
ALTER TABLE public.auto_billing_settings ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "Admins can manage billing settings"
ON public.auto_billing_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- إضافة realtime للإشعارات
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;