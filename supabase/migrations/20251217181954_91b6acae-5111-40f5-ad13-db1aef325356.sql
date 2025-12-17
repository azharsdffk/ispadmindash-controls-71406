-- Create storage bucket for work photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-photos', 'work-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for work photos
CREATE POLICY "Technicians can upload work photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'work-photos' 
  AND has_role(auth.uid(), 'technician'::app_role)
);

CREATE POLICY "Technicians can view work photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'work-photos' 
  AND (has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can manage work photos"
ON storage.objects FOR ALL
USING (bucket_id = 'work-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Work logs table for tracking start/end of work
CREATE TABLE public.work_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Work photos table
CREATE TABLE public.work_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_log_id UUID NOT NULL REFERENCES public.work_logs(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for work_logs
CREATE POLICY "Technicians can view their own work logs"
ON public.work_logs FOR SELECT
USING (technician_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can insert their own work logs"
ON public.work_logs FOR INSERT
WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Technicians can update their own work logs"
ON public.work_logs FOR UPDATE
USING (technician_id = auth.uid());

CREATE POLICY "Admins can manage all work logs"
ON public.work_logs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for work_photos
CREATE POLICY "Technicians can view their own work photos"
ON public.work_photos FOR SELECT
USING (technician_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can insert their own work photos"
ON public.work_photos FOR INSERT
WITH CHECK (technician_id = auth.uid());

CREATE POLICY "Admins can manage all work photos"
ON public.work_photos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to calculate work duration
CREATE OR REPLACE FUNCTION public.calculate_work_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-calculate duration
CREATE TRIGGER calculate_work_duration_trigger
BEFORE UPDATE ON public.work_logs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_work_duration();