-- إنشاء جدول إعدادات SMS
CREATE TABLE IF NOT EXISTS public.sms_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'twilio',
  sender_name TEXT NOT NULL,
  sender_number TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- إنشاء جدول سجل الرسائل
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL,
  provider_message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_sms_status CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'queued'))
);

-- إنشاء جدول قوالب الرسائل
CREATE TABLE IF NOT EXISTS public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_key TEXT NOT NULL UNIQUE,
  message_template TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- إنشاء جدول إعدادات الإشعارات التلقائية
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  template_id UUID REFERENCES public.sms_templates(id),
  trigger_days_before INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('invoice_due', 'contract_expiry', 'payment_reminder', 'maintenance_scheduled', 'custom'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.sms_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_sms_templates_key ON public.sms_templates(template_key);

-- Enable RLS
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sms_settings
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_settings' AND policyname = 'Admins can manage SMS settings') THEN
    CREATE POLICY "Admins can manage SMS settings"
      ON public.sms_settings
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- RLS Policies for sms_logs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'Admins can view SMS logs') THEN
    CREATE POLICY "Admins can view SMS logs"
      ON public.sms_logs
      FOR SELECT
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'System can insert SMS logs') THEN
    CREATE POLICY "System can insert SMS logs"
      ON public.sms_logs
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'System can update SMS logs') THEN
    CREATE POLICY "System can update SMS logs"
      ON public.sms_logs
      FOR UPDATE
      USING (true);
  END IF;
END $$;

-- RLS Policies for sms_templates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_templates' AND policyname = 'Admins can manage SMS templates') THEN
    CREATE POLICY "Admins can manage SMS templates"
      ON public.sms_templates
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- RLS Policies for notification_rules
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'Admins can manage notification rules') THEN
    CREATE POLICY "Admins can manage notification rules"
      ON public.notification_rules
      FOR ALL
      USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Triggers
DROP TRIGGER IF EXISTS update_sms_settings_updated_at ON public.sms_settings;
CREATE TRIGGER update_sms_settings_updated_at
  BEFORE UPDATE ON public.sms_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON public.sms_templates;
CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON public.sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON public.notification_rules;
CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- إدراج قوالب افتراضية
INSERT INTO public.sms_templates (name, template_key, message_template, description) VALUES
  ('تذكير بالفاتورة', 'invoice_reminder', 'عزيزي {name}، لديك فاتورة بقيمة {amount} مستحقة بتاريخ {due_date}. يرجى السداد في أقرب وقت. شكراً لك.', 'تذكير بفاتورة مستحقة'),
  ('تنبيه انتهاء العقد', 'contract_expiry', 'عزيزي {name}، عقدك رقم {contract_number} سينتهي بتاريخ {end_date}. للتجديد يرجى التواصل معنا.', 'تنبيه قبل انتهاء العقد'),
  ('موعد صيانة', 'maintenance_scheduled', 'عزيزي {name}، تم جدولة موعد صيانة لك بتاريخ {scheduled_date}. الفني: {technician_name}', 'تنبيه بموعد صيانة'),
  ('تأكيد دفع', 'payment_confirmation', 'عزيزي {name}، تم استلام دفعتك بقيمة {amount}. رقم الإيصال: {receipt_number}. شكراً لك.', 'تأكيد استلام دفعة')
ON CONFLICT (template_key) DO NOTHING;