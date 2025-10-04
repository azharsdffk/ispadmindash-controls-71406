-- إضافة البيانات الأولية للعملات في جدول exchange_rates إذا لم تكن موجودة
-- ملاحظة: الجداول الأساسية موجودة بالفعل (subscribers, invoices, payments, audit_logs, notifications, employee_locations, user_roles)

-- إضافة جدول external_imports لاستيراد البيانات الخارجية
CREATE TABLE IF NOT EXISTS public.external_imports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source text NOT NULL,
  raw_data jsonb,
  status text DEFAULT 'pending',
  records_processed integer DEFAULT 0,
  imported_by uuid REFERENCES auth.users(id),
  imported_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- تفعيل RLS على external_imports
ALTER TABLE public.external_imports ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لـ external_imports
CREATE POLICY "Admins can manage external imports"
ON public.external_imports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view external imports"
ON public.external_imports
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- إضافة معدلات صرف افتراضية للعملات (IQD و USD)
INSERT INTO public.exchange_rates (from_currency, to_currency, rate, effective_date, created_by)
VALUES 
  ('IQD', 'USD', 0.00076, CURRENT_DATE, NULL),
  ('USD', 'IQD', 1310.00, CURRENT_DATE, NULL)
ON CONFLICT DO NOTHING;

-- إضافة تعليق توضيحي
COMMENT ON TABLE public.external_imports IS 'جدول لتتبع استيراد البيانات من المصادر الخارجية مثل National Project و SAS';

-- ملاحظة: الجداول التالية موجودة بالفعل بأسماء مختلفة:
-- users → auth.users + profiles
-- roles → user_roles + app_role enum
-- receipts → payments
-- expenses → expense_vouchers
-- user_locations → employee_locations
-- currencies → currency_type enum + exchange_rates