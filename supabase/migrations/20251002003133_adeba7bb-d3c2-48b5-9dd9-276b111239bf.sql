-- Fix search_path for all functions

-- Fix generate_invoice_number function
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
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

-- Fix generate_ticket_number function
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT
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

-- Fix generate_voucher_number function
CREATE OR REPLACE FUNCTION public.generate_voucher_number()
RETURNS TEXT
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

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;