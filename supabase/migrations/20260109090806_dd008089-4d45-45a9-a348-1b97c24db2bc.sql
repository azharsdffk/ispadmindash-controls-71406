-- Drop the overly permissive policy that allows any authenticated user to view all subscribers
DROP POLICY IF EXISTS "Authenticated can view subscribers" ON public.subscribers;

-- Drop any conflicting policies first
DROP POLICY IF EXISTS "Admins can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Agents can view assigned subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Technicians can view assigned subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Accountants can view subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can insert subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON public.subscribers;

-- Admin: Full access
CREATE POLICY "Admins can view subscribers" ON public.subscribers
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Technician: Only view subscribers from tickets assigned to them
CREATE POLICY "Technicians can view assigned subscribers" ON public.subscribers
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'technician')
  AND EXISTS (
    SELECT 1 FROM public.maintenance_tickets mt
    WHERE mt.subscriber_id = subscribers.id
    AND mt.technician_id = auth.uid()
  )
);

-- Accountant: View subscribers for financial purposes
CREATE POLICY "Accountants can view subscribers" ON public.subscribers
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'accountant'));

-- Policies for INSERT, UPDATE, DELETE - admin only
CREATE POLICY "Admins can insert subscribers" ON public.subscribers
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update subscribers" ON public.subscribers
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete subscribers" ON public.subscribers
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));