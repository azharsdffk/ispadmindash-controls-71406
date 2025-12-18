-- Create technician ratings table
CREATE TABLE public.technician_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticket_id)
);

-- Create technician stats table for tracking performance
CREATE TABLE public.technician_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE UNIQUE,
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  reputation_level TEXT DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create work reports table
CREATE TABLE public.work_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  work_log_id UUID NOT NULL REFERENCES public.work_logs(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  diagnosis TEXT,
  work_performed TEXT,
  parts_used JSONB DEFAULT '[]',
  labor_cost NUMERIC DEFAULT 0,
  parts_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  customer_signature TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  report_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technician_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for technician_ratings
CREATE POLICY "Admins can manage all ratings"
  ON public.technician_ratings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can view their own ratings"
  ON public.technician_ratings FOR SELECT
  USING (technician_id = auth.uid());

CREATE POLICY "System can insert ratings"
  ON public.technician_ratings FOR INSERT
  WITH CHECK (true);

-- RLS policies for technician_stats
CREATE POLICY "Admins can manage all stats"
  ON public.technician_stats FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can view their own stats"
  ON public.technician_stats FOR SELECT
  USING (technician_id = auth.uid());

CREATE POLICY "System can manage stats"
  ON public.technician_stats FOR ALL
  USING (true);

-- RLS policies for work_reports
CREATE POLICY "Admins can manage all work reports"
  ON public.work_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can manage their own reports"
  ON public.work_reports FOR ALL
  USING (technician_id = auth.uid());

CREATE POLICY "Technicians can insert reports"
  ON public.work_reports FOR INSERT
  WITH CHECK (technician_id = auth.uid());

-- Function to update technician stats after rating
CREATE OR REPLACE FUNCTION public.update_technician_stats_on_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_total_ratings INTEGER;
  v_new_level TEXT;
BEGIN
  -- Calculate new average and total
  SELECT AVG(rating), COUNT(*)
  INTO v_avg_rating, v_total_ratings
  FROM public.technician_ratings
  WHERE technician_id = NEW.technician_id;
  
  -- Determine reputation level
  IF v_avg_rating >= 4.5 AND v_total_ratings >= 50 THEN
    v_new_level := 'platinum';
  ELSIF v_avg_rating >= 4.0 AND v_total_ratings >= 25 THEN
    v_new_level := 'gold';
  ELSIF v_avg_rating >= 3.5 AND v_total_ratings >= 10 THEN
    v_new_level := 'silver';
  ELSE
    v_new_level := 'bronze';
  END IF;
  
  -- Update or insert stats
  INSERT INTO public.technician_stats (technician_id, average_rating, total_ratings, reputation_level, total_points)
  VALUES (NEW.technician_id, v_avg_rating, v_total_ratings, v_new_level, v_total_ratings * 10)
  ON CONFLICT (technician_id)
  DO UPDATE SET
    average_rating = v_avg_rating,
    total_ratings = v_total_ratings,
    reputation_level = v_new_level,
    total_points = v_total_ratings * 10,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Trigger for rating stats update
CREATE TRIGGER update_stats_on_rating
  AFTER INSERT ON public.technician_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_technician_stats_on_rating();

-- Function to update job counts
CREATE OR REPLACE FUNCTION public.update_technician_job_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'resolved' OR NEW.status = 'closed' THEN
    INSERT INTO public.technician_stats (technician_id, total_jobs, completed_jobs)
    VALUES (NEW.technician_id, 1, 1)
    ON CONFLICT (technician_id)
    DO UPDATE SET
      completed_jobs = technician_stats.completed_jobs + 1,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for job stats
CREATE TRIGGER update_job_stats_on_ticket_complete
  AFTER UPDATE ON public.maintenance_tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.technician_id IS NOT NULL)
  EXECUTE FUNCTION public.update_technician_job_stats();