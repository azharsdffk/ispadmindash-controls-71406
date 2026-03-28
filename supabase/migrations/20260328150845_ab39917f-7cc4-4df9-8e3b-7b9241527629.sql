
-- Recreate subscribers_map_view: remove phone PII, use security_invoker
DROP VIEW IF EXISTS public.subscribers_map_view;
CREATE VIEW public.subscribers_map_view WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name,
  s.address,
  s.latitude,
  s.longitude,
  s.agent_id
FROM public.subscribers s
WHERE s.latitude IS NOT NULL AND s.longitude IS NOT NULL;

-- Recreate tickets_map_view: remove subscriber_phone PII, use security_invoker
DROP VIEW IF EXISTS public.tickets_map_view;
CREATE VIEW public.tickets_map_view WITH (security_invoker = true) AS
SELECT
  mt.id,
  mt.ticket_number,
  mt.issue_description,
  mt.priority,
  mt.status,
  mt.scheduled_date,
  mt.latitude,
  mt.longitude,
  mt.location_address,
  s.name AS subscriber_name,
  s.address AS subscriber_address,
  mt.technician_id,
  t.name AS technician_name,
  mt.created_at
FROM public.maintenance_tickets mt
LEFT JOIN public.subscribers s ON s.id = mt.subscriber_id
LEFT JOIN public.technicians t ON t.id = mt.technician_id;

-- Recreate technicians_map_view: remove phone PII, use security_invoker
DROP VIEW IF EXISTS public.technicians_map_view;
CREATE VIEW public.technicians_map_view WITH (security_invoker = true) AS
SELECT
  t.id,
  t.name,
  t.specialization,
  t.latitude,
  t.longitude,
  t.status,
  t.available,
  t.user_id
FROM public.technicians t;
