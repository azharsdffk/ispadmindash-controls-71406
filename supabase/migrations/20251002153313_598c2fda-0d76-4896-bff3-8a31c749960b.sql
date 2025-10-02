-- =====================================================
-- CRITICAL SECURITY FIX: RBAC Implementation
-- =====================================================
-- This migration fixes the data leak vulnerability where
-- any authenticated user could access all subscriber data.
-- It implements proper role-based access control (RBAC).
-- =====================================================

-- Step 1: Modify the user signup trigger to auto-assign admin role to FIRST user
-- This creates the bootstrap admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_count INTEGER;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Check if this is the first user
  SELECT COUNT(*) INTO v_user_count FROM auth.users;
  
  -- Auto-assign admin role to the FIRST user only
  IF v_user_count = 1 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 2: Fix all security definer functions to include SET search_path
-- This prevents search_path manipulation attacks

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS text
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

-- Step 3: DROP all existing permissive policies on subscribers table
DROP POLICY IF EXISTS "Accountants can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins and accountants can manage subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Technicians can view assigned subscribers" ON public.subscribers;

-- Step 4: CREATE explicit, restrictive policies for subscribers table
-- These ensure ONLY users with specific roles can access subscriber data

-- SELECT policies: Who can VIEW subscriber data
CREATE POLICY "Admins can view all subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can view all subscribers"
ON public.subscribers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'accountant'));

CREATE POLICY "Technicians can view assigned subscribers only"
ON public.subscribers
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'technician') 
  AND id IN (
    SELECT subscriber_id 
    FROM public.maintenance_tickets 
    WHERE technician_id = auth.uid()
  )
);

-- INSERT policies: Who can CREATE subscribers
CREATE POLICY "Admins can create subscribers"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can create subscribers"
ON public.subscribers
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'accountant'));

-- UPDATE policies: Who can MODIFY subscribers
CREATE POLICY "Admins can update subscribers"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Accountants can update subscribers"
ON public.subscribers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'accountant'))
WITH CHECK (has_role(auth.uid(), 'accountant'));

-- DELETE policies: Who can REMOVE subscribers
CREATE POLICY "Only admins can delete subscribers"
ON public.subscribers
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Step 5: Secure the employees table with explicit policies
DROP POLICY IF EXISTS "Admins can manage employees" ON public.employees;
DROP POLICY IF EXISTS "Employees can view their own data" ON public.employees;

CREATE POLICY "Admins can view all employees"
ON public.employees
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Employees can view their own data"
ON public.employees
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert employees"
ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete employees"
ON public.employees
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Step 6: Restrict packages table - only authenticated users can view
DROP POLICY IF EXISTS "Anyone can view active packages" ON public.packages;

CREATE POLICY "Authenticated users can view active packages"
ON public.packages
FOR SELECT
TO authenticated
USING (active = true);

-- Step 7: Add table comments documenting the security model
COMMENT ON TABLE public.subscribers IS 'Contains sensitive customer PII. Access restricted by role: admin (full), accountant (full), technician (assigned only).';
COMMENT ON TABLE public.employees IS 'Contains employee data. Access restricted: admin (full), self (own data only).';
COMMENT ON TABLE public.user_roles IS 'Role assignments. Only admins can manage. First user automatically becomes admin.';