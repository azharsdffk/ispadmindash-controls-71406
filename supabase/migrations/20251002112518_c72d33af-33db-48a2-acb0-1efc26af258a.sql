-- Phase 1: Fix Critical Data Access Controls

-- 1. Restrict Technicians Table Access
DROP POLICY IF EXISTS "Authenticated users can view technicians" ON public.technicians;

CREATE POLICY "Admins can view all technicians"
ON public.technicians
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can view their own data"
ON public.technicians
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can view assigned technicians"
ON public.technicians
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT technician_id 
    FROM public.maintenance_tickets 
    WHERE subscriber_id IN (
      SELECT id FROM public.subscribers WHERE created_by = auth.uid()
    )
  )
);

-- 2. Restrict Inventory Access
DROP POLICY IF EXISTS "All authenticated users can view inventory" ON public.inventory;

CREATE POLICY "Admins and accountants can view inventory"
ON public.inventory
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

-- 3. Restrict Exchange Rates Access
DROP POLICY IF EXISTS "Authenticated users can view exchange rates" ON public.exchange_rates;

CREATE POLICY "Admins and accountants can view exchange rates"
ON public.exchange_rates
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'accountant'::app_role)
);

-- 4. Restrict Geofence Zones Access
DROP POLICY IF EXISTS "Authenticated users can view geofence zones" ON public.geofence_zones;

CREATE POLICY "Only admins can view geofence zones"
ON public.geofence_zones
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Fix Database Function Search Paths

CREATE OR REPLACE FUNCTION public.generate_voucher_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.vouchers;
  v_number := 'VCH-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.maintenance_tickets;
  v_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count FROM public.invoices;
  v_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_number;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;