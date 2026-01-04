-- Create ticket_events table for tracking all events
CREATE TABLE public.ticket_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  latitude NUMERIC,
  longitude NUMERIC,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create technician_locations table for live tracking
CREATE TABLE public.technician_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id UUID NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  ticket_id UUID REFERENCES public.maintenance_tickets(id),
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  heading NUMERIC,
  speed NUMERIC,
  status TEXT DEFAULT 'idle',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(technician_id)
);

-- Create visit_logs table for check-in/check-out tracking
CREATE TABLE public.visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.maintenance_tickets(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES public.technicians(id),
  departed_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  work_started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  departure_location JSONB,
  arrival_location JSONB,
  completion_location JSONB,
  eta_minutes INTEGER,
  actual_travel_minutes INTEGER,
  actual_work_minutes INTEGER,
  notes TEXT,
  before_photos TEXT[],
  after_photos TEXT[],
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  customer_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_ticket_events_ticket_id ON public.ticket_events(ticket_id);
CREATE INDEX idx_ticket_events_created_at ON public.ticket_events(created_at DESC);
CREATE INDEX idx_technician_locations_technician_id ON public.technician_locations(technician_id);
CREATE INDEX idx_technician_locations_updated_at ON public.technician_locations(updated_at DESC);
CREATE INDEX idx_visit_logs_ticket_id ON public.visit_logs(ticket_id);
CREATE INDEX idx_visit_logs_technician_id ON public.visit_logs(technician_id);

-- Enable RLS
ALTER TABLE public.ticket_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ticket_events
CREATE POLICY "Admins can manage all ticket events" 
ON public.ticket_events FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can insert events for their tickets" 
ON public.ticket_events FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM maintenance_tickets 
    WHERE id = ticket_id AND technician_id = auth.uid()
  )
);

CREATE POLICY "Technicians can view events for their tickets" 
ON public.ticket_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets 
    WHERE id = ticket_id AND technician_id = auth.uid()
  )
);

CREATE POLICY "Clients can view their ticket events" 
ON public.ticket_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.id = ticket_id AND su.user_id = auth.uid()
  )
);

-- RLS Policies for technician_locations
CREATE POLICY "Admins can manage all technician locations" 
ON public.technician_locations FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can manage their own location" 
ON public.technician_locations FOR ALL 
USING (technician_id = auth.uid());

CREATE POLICY "Clients can view assigned technician location" 
ON public.technician_locations FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.technician_id = technician_locations.technician_id 
    AND su.user_id = auth.uid()
    AND mt.status IN ('tech_assigned', 'tech_on_the_way', 'tech_arrived', 'in_progress')
  )
);

-- RLS Policies for visit_logs
CREATE POLICY "Admins can manage all visit logs" 
ON public.visit_logs FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can manage their visit logs" 
ON public.visit_logs FOR ALL 
USING (technician_id = auth.uid());

CREATE POLICY "Clients can view their visit logs" 
ON public.visit_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.id = ticket_id AND su.user_id = auth.uid()
  )
);

CREATE POLICY "Clients can rate their visits" 
ON public.visit_logs FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM maintenance_tickets mt
    JOIN subscriber_users su ON mt.subscriber_id = su.subscriber_id
    WHERE mt.id = ticket_id AND su.user_id = auth.uid()
  )
);

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tickets;

-- Create function to log ticket events automatically
CREATE OR REPLACE FUNCTION public.log_ticket_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.ticket_events (ticket_id, event_type, event_data, created_by)
    VALUES (
      NEW.id,
      NEW.status::TEXT,
      jsonb_build_object(
        'old_status', OLD.status::TEXT,
        'new_status', NEW.status::TEXT,
        'technician_id', NEW.technician_id,
        'updated_at', NOW()
      ),
      auth.uid()
    );
  END IF;
  
  -- Also log technician assignment
  IF OLD.technician_id IS DISTINCT FROM NEW.technician_id AND NEW.technician_id IS NOT NULL THEN
    INSERT INTO public.ticket_events (ticket_id, event_type, event_data, created_by)
    VALUES (
      NEW.id,
      'technician_assigned',
      jsonb_build_object(
        'technician_id', NEW.technician_id,
        'assigned_at', NOW()
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic event logging
CREATE TRIGGER on_ticket_status_change
  AFTER UPDATE ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.log_ticket_status_change();