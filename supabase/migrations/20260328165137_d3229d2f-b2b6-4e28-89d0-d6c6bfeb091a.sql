
-- Create maintenance_reports table for technician work reports
CREATE TABLE IF NOT EXISTS public.maintenance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id),
  diagnosis TEXT,
  work_performed TEXT NOT NULL,
  parts_used JSONB DEFAULT '[]'::jsonb,
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',
  customer_signature TEXT,
  notes TEXT,
  report_status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;

-- Technicians can view/insert their own reports
CREATE POLICY "Technicians can view own reports" ON public.maintenance_reports
  FOR SELECT TO authenticated
  USING (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Technicians can insert own reports" ON public.maintenance_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Technicians can update own reports" ON public.maintenance_reports
  FOR UPDATE TO authenticated
  USING (
    technician_id IN (SELECT id FROM public.technicians WHERE user_id = auth.uid())
    OR public.is_admin()
  );

-- Clients can view reports for their tickets
CREATE POLICY "Clients view own ticket reports" ON public.maintenance_reports
  FOR SELECT TO authenticated
  USING (
    ticket_id IN (
      SELECT mt.id FROM public.maintenance_tickets mt
      JOIN public.subscriber_users su ON su.subscriber_id = mt.subscriber_id
      WHERE su.user_id = auth.uid()
    )
  );

-- Create storage bucket for technician work photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('technician-photos', 'technician-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for technician photos
CREATE POLICY "Authenticated users can upload technician photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'technician-photos');

CREATE POLICY "Anyone can view technician photos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'technician-photos');

-- Add realtime for maintenance_reports
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_reports;

-- Updated_at trigger
CREATE TRIGGER update_maintenance_reports_updated_at
  BEFORE UPDATE ON public.maintenance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Notification trigger: notify customer when report is created
CREATE OR REPLACE FUNCTION public.notify_on_report_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_subscriber_id uuid;
  v_customer_user_id uuid;
  v_ticket_number text;
BEGIN
  -- Get subscriber and ticket info
  SELECT mt.subscriber_id, mt.ticket_number INTO v_subscriber_id, v_ticket_number
  FROM public.maintenance_tickets mt WHERE mt.id = NEW.ticket_id;

  -- Get customer user_id
  SELECT su.user_id INTO v_customer_user_id
  FROM public.subscriber_users su WHERE su.subscriber_id = v_subscriber_id LIMIT 1;

  IF v_customer_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_customer_user_id,
      'تقرير صيانة جديد',
      'تم إنشاء تقرير صيانة للطلب ' || COALESCE(v_ticket_number, ''),
      'ticket',
      '/customer-portal'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_on_report
  AFTER INSERT ON public.maintenance_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_report_created();
