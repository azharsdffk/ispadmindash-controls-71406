-- Create audit log for employee data access
CREATE TABLE IF NOT EXISTS public.employee_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID REFERENCES auth.users(id) NOT NULL,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  action TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employee_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view employee access logs"
ON public.employee_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert access logs
CREATE POLICY "System can insert employee access logs"
ON public.employee_access_logs
FOR INSERT
WITH CHECK (true);

-- Create subscriber_users table to link subscribers to user accounts (for client portal)
CREATE TABLE IF NOT EXISTS public.subscriber_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscriber_id UUID REFERENCES public.subscribers(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, subscriber_id)
);

ALTER TABLE public.subscriber_users ENABLE ROW LEVEL SECURITY;

-- Clients can view their own subscriber link
CREATE POLICY "Clients can view their own subscriber link"
ON public.subscriber_users
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage subscriber links
CREATE POLICY "Admins can manage subscriber links"
ON public.subscriber_users
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update subscribers RLS to allow clients to view their own data
CREATE POLICY "Clients can view their own subscriber data"
ON public.subscribers
FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role) 
  AND id IN (
    SELECT subscriber_id 
    FROM public.subscriber_users 
    WHERE user_id = auth.uid()
  )
);

-- Clients can view their own invoices
CREATE POLICY "Clients can view their own invoices"
ON public.invoices
FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role)
  AND subscriber_id IN (
    SELECT subscriber_id 
    FROM public.subscriber_users 
    WHERE user_id = auth.uid()
  )
);

-- Clients can view their own payments
CREATE POLICY "Clients can view their own payments"
ON public.payments
FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role)
  AND subscriber_id IN (
    SELECT subscriber_id 
    FROM public.subscriber_users 
    WHERE user_id = auth.uid()
  )
);

-- Clients can view their own maintenance tickets
CREATE POLICY "Clients can view their own maintenance tickets"
ON public.maintenance_tickets
FOR SELECT
USING (
  has_role(auth.uid(), 'client'::app_role)
  AND subscriber_id IN (
    SELECT subscriber_id 
    FROM public.subscriber_users 
    WHERE user_id = auth.uid()
  )
);

-- Clients can create their own maintenance tickets
CREATE POLICY "Clients can create their own maintenance tickets"
ON public.maintenance_tickets
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'client'::app_role)
  AND subscriber_id IN (
    SELECT subscriber_id 
    FROM public.subscriber_users 
    WHERE user_id = auth.uid()
  )
);