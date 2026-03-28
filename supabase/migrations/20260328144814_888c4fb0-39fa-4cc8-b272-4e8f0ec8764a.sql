-- Revoke public/anon access to sensitive views
REVOKE ALL ON public.subscribers_map_view FROM anon;
REVOKE ALL ON public.tickets_map_view FROM anon;

-- Revoke broad authenticated access and re-grant selectively
REVOKE SELECT ON public.subscribers_map_view FROM authenticated;
REVOKE SELECT ON public.tickets_map_view FROM authenticated;

-- Grant access only to authenticated (RLS will enforce role checks)
GRANT SELECT ON public.subscribers_map_view TO authenticated;
GRANT SELECT ON public.tickets_map_view TO authenticated;

-- Since views with security_invoker=true respect underlying table RLS,
-- we need to ensure the underlying tables have proper RLS.
-- But for extra protection, create wrapper functions that check roles.

-- Create a secure function for subscribers map data (admin/agent only)
CREATE OR REPLACE FUNCTION public.get_subscribers_map_data()
RETURNS TABLE (
  id uuid,
  name text,
  phone text,
  address text,
  latitude numeric,
  longitude numeric,
  status text,
  agent_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admin, super_admin, agent, or technician can access
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin', 'agent', 'technical_manager')
      AND approved = true
  ) THEN
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;

  RETURN QUERY SELECT
    s.id, s.name, s.phone, s.address, s.latitude, s.longitude,
    s.status::text, s.agent_id
  FROM public.subscribers s;
END;
$$;

-- Create a secure function for tickets map data (admin/agent/technician only)
CREATE OR REPLACE FUNCTION public.get_tickets_map_data()
RETURNS TABLE (
  id uuid,
  ticket_number text,
  subscriber_name text,
  subscriber_phone text,
  subscriber_address text,
  issue_description text,
  latitude numeric,
  longitude numeric,
  status text,
  priority text,
  technician_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
BEGIN
  -- Get the user's role
  SELECT ur.role::text INTO v_user_role
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid()
    AND ur.approved = true
  LIMIT 1;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Access denied: no approved role';
  END IF;

  IF v_user_role IN ('admin', 'super_admin', 'technical_manager', 'agent') THEN
    -- Full access
    RETURN QUERY SELECT
      mt.id, mt.ticket_number,
      s.name, s.phone, s.address,
      mt.issue_description,
      mt.latitude, mt.longitude,
      mt.status::text, mt.priority::text,
      mt.technician_id
    FROM public.maintenance_tickets mt
    LEFT JOIN public.subscribers s ON s.id = mt.subscriber_id;
  ELSIF v_user_role = 'technician' THEN
    -- Only assigned tickets
    RETURN QUERY SELECT
      mt.id, mt.ticket_number,
      s.name, s.phone, s.address,
      mt.issue_description,
      mt.latitude, mt.longitude,
      mt.status::text, mt.priority::text,
      mt.technician_id
    FROM public.maintenance_tickets mt
    LEFT JOIN public.subscribers s ON s.id = mt.subscriber_id
    WHERE mt.technician_id IN (
      SELECT t.id FROM public.technicians t WHERE t.user_id = auth.uid()
    );
  ELSE
    -- No access for other roles
    RAISE EXCEPTION 'Access denied: insufficient privileges';
  END IF;
END;
$$;