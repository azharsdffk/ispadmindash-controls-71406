
-- CRITICAL FIX 2: Recreate views with security_invoker = true
DROP VIEW IF EXISTS public.subscribers_map_view;
CREATE VIEW public.subscribers_map_view WITH (security_invoker = true) AS
SELECT 
  s.id,
  s.name,
  s.phone,
  s.address,
  s.latitude,
  s.longitude,
  s.plan
FROM public.subscribers s
WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL;

DROP VIEW IF EXISTS public.tickets_map_view;
CREATE VIEW public.tickets_map_view WITH (security_invoker = true) AS
SELECT 
  mt.id,
  mt.ticket_number,
  mt.issue_description,
  mt.issue_type,
  mt.status,
  mt.priority,
  mt.latitude,
  mt.longitude,
  mt.location_address,
  mt.technician_id,
  mt.subscriber_id,
  mt.scheduled_date,
  mt.created_at,
  s.name as subscriber_name,
  s.phone as subscriber_phone,
  s.address as subscriber_address
FROM public.maintenance_tickets mt
LEFT JOIN public.subscribers s ON mt.subscriber_id = s.id
WHERE mt.latitude IS NOT NULL AND mt.longitude IS NOT NULL;

-- CRITICAL FIX 3: Fix technician ticket policy
DROP POLICY IF EXISTS "Technicians can view assigned tickets" ON public.maintenance_tickets;
CREATE POLICY "Technicians can view assigned tickets" ON public.maintenance_tickets
FOR SELECT TO authenticated
USING (technician_id = auth.uid());

-- FIX 4: Enable RLS on tables missing policies
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to otp_rate_limits" ON public.otp_rate_limits
FOR ALL TO authenticated USING (false);

CREATE POLICY "No direct access to otp_verification_attempts" ON public.otp_verification_attempts
FOR ALL TO authenticated USING (false);

CREATE POLICY "No direct access to rate_limit_attempts" ON public.rate_limit_attempts
FOR ALL TO authenticated USING (false);

-- FIX 5: Restrict ticket_events to relevant users only
DROP POLICY IF EXISTS "Authenticated can view ticket events" ON public.ticket_events;
CREATE POLICY "Users can view relevant ticket events" ON public.ticket_events
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') 
  OR created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.maintenance_tickets mt 
    WHERE mt.id = ticket_events.ticket_id 
    AND (mt.technician_id = auth.uid() OR mt.created_by = auth.uid())
  )
);
