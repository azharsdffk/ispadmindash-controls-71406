-- إضافة دعم العملات المتعددة
CREATE TYPE public.currency_type AS ENUM ('IQD', 'USD');

-- إضافة حقل العملة للفواتير
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS currency currency_type DEFAULT 'IQD';

-- إضافة حقل العملة للمدفوعات
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS currency currency_type DEFAULT 'IQD';

-- إضافة حقل العملة للسندات
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS currency currency_type DEFAULT 'IQD';

-- جدول أسعار الصرف
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency currency_type NOT NULL,
  to_currency currency_type NOT NULL,
  rate NUMERIC(10,4) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(from_currency, to_currency, effective_date)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage exchange rates"
  ON public.exchange_rates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- جدول مواقع الموظفين
CREATE TABLE IF NOT EXISTS public.employee_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  accuracy NUMERIC(10,2),
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.employee_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own location"
  ON public.employee_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all locations"
  ON public.employee_locations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own location"
  ON public.employee_locations FOR SELECT
  USING (auth.uid() = user_id);

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_employee_locations_user_id ON public.employee_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_recorded_at ON public.employee_locations(recorded_at DESC);

-- جدول المناطق الجغرافية (Geofencing)
CREATE TABLE IF NOT EXISTS public.geofence_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  center_lat NUMERIC(10,8) NOT NULL,
  center_lng NUMERIC(11,8) NOT NULL,
  radius_meters NUMERIC(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.geofence_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view geofence zones"
  ON public.geofence_zones FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage geofence zones"
  ON public.geofence_zones FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- إصلاح سياسات RLS للأمان (من المراجعة الأمنية)
DROP POLICY IF EXISTS "Authenticated users can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Authenticated users can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can view payments" ON public.payments;
DROP POLICY IF EXISTS "Authenticated users can view vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated users can view tickets" ON public.maintenance_tickets;

-- سياسات آمنة للمشتركين
CREATE POLICY "Admins can view all subscribers"
  ON public.subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view all subscribers"
  ON public.subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'accountant'));

CREATE POLICY "Technicians can view assigned subscribers"
  ON public.subscribers FOR SELECT
  USING (
    public.has_role(auth.uid(), 'technician') AND 
    id IN (
      SELECT subscriber_id FROM public.maintenance_tickets 
      WHERE technician_id = auth.uid()
    )
  );

-- سياسات آمنة للفواتير
CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view all invoices"
  ON public.invoices FOR SELECT
  USING (public.has_role(auth.uid(), 'accountant'));

-- سياسات آمنة للمدفوعات
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view all payments"
  ON public.payments FOR SELECT
  USING (public.has_role(auth.uid(), 'accountant'));

-- سياسات آمنة للسندات
CREATE POLICY "Admins can view all vouchers"
  ON public.vouchers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view all vouchers"
  ON public.vouchers FOR SELECT
  USING (public.has_role(auth.uid(), 'accountant'));

-- سياسات آمنة للتذاكر
CREATE POLICY "Admins can view all tickets"
  ON public.maintenance_tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view their tickets"
  ON public.maintenance_tickets FOR SELECT
  USING (
    public.has_role(auth.uid(), 'technician') AND 
    technician_id = auth.uid()
  );

CREATE POLICY "Accountants can view all tickets"
  ON public.maintenance_tickets FOR SELECT
  USING (public.has_role(auth.uid(), 'accountant'));