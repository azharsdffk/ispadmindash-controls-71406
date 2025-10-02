-- Create packages table for internet plans
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  speed_mbps INTEGER NOT NULL,
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  currency currency_type DEFAULT 'IQD',
  description TEXT,
  features JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create connection_history table for tracking subscriber connection status
CREATE TABLE IF NOT EXISTS public.connection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('connected', 'disconnected', 'suspended', 'maintenance')),
  ip_address INET,
  download_speed NUMERIC,
  upload_speed NUMERIC,
  connection_quality TEXT CHECK (connection_quality IN ('excellent', 'good', 'fair', 'poor')),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  recorded_by UUID REFERENCES auth.users(id)
);

-- Create complaints table (separate from maintenance)
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_number TEXT UNIQUE NOT NULL,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('billing', 'service', 'technical', 'support', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create function to generate complaint numbers
CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.complaints;
  v_number := 'CMP-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

-- Add default complaint number
ALTER TABLE public.complaints 
ALTER COLUMN complaint_number SET DEFAULT generate_complaint_number();

-- Enable RLS on new tables
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Anyone can view active packages"
ON public.packages FOR SELECT
USING (active = true);

CREATE POLICY "Admins can manage packages"
ON public.packages FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for connection_history
CREATE POLICY "Admins can view all connection history"
ON public.connection_history FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Technicians can view connection history"
ON public.connection_history FOR SELECT
USING (has_role(auth.uid(), 'technician'));

CREATE POLICY "Admins and technicians can insert connection history"
ON public.connection_history FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'technician'));

-- RLS Policies for complaints
CREATE POLICY "Admins can view all complaints"
ON public.complaints FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their assigned complaints"
ON public.complaints FOR SELECT
USING (auth.uid() = assigned_to);

CREATE POLICY "Admins can manage complaints"
ON public.complaints FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at
BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_phone ON public.subscribers(phone);
CREATE INDEX IF NOT EXISTS idx_subscribers_created_at ON public.subscribers(created_at);
CREATE INDEX IF NOT EXISTS idx_subscribers_balance ON public.subscribers(balance);

CREATE INDEX IF NOT EXISTS idx_invoices_subscriber ON public.invoices(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX IF NOT EXISTS idx_payments_subscriber ON public.payments(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_maintenance_subscriber ON public.maintenance_tickets(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_technician ON public.maintenance_tickets(technician_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_tickets(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

CREATE INDEX IF NOT EXISTS idx_connection_subscriber ON public.connection_history(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_connection_recorded_at ON public.connection_history(recorded_at);

CREATE INDEX IF NOT EXISTS idx_complaints_subscriber ON public.complaints(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned ON public.complaints(assigned_to);

CREATE INDEX IF NOT EXISTS idx_employee_locations_user ON public.employee_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_locations_recorded ON public.employee_locations(recorded_at);

-- Add some default packages
INSERT INTO public.packages (name, name_en, speed_mbps, monthly_price, currency, description, features) VALUES
('باقة أساسية', 'Basic Plan', 100, 50000, 'IQD', 'باقة مناسبة للاستخدام الخفيف', '["100 ميجا سرعة", "دعم فني 24/7", "بدون حد للتحميل"]'),
('باقة متوسطة', 'Standard Plan', 250, 100000, 'IQD', 'باقة مناسبة للعائلات', '["250 ميجا سرعة", "دعم فني 24/7", "بدون حد للتحميل", "IP ثابت"]'),
('باقة متقدمة', 'Premium Plan', 500, 150000, 'IQD', 'باقة مناسبة للشركات الصغيرة', '["500 ميجا سرعة", "دعم فني مخصص", "بدون حد للتحميل", "IP ثابت", "أولوية في الدعم"]'),
('باقة فائقة', 'Ultimate Plan', 1000, 250000, 'IQD', 'باقة مناسبة للشركات الكبيرة', '["1 جيجا سرعة", "دعم فني مخصص", "بدون حد للتحميل", "IP ثابت", "أولوية قصوى", "ضمان وقت التشغيل 99.9%"]')
ON CONFLICT DO NOTHING;