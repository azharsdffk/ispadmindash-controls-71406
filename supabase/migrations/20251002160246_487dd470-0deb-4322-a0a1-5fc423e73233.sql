-- Add RLS policies to block anonymous access to sensitive tables

-- Block anonymous access to profiles table
CREATE POLICY "Authenticated users only can access profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (true);

-- Block anonymous access to subscribers table
CREATE POLICY "Authenticated users only can access subscribers"
ON public.subscribers
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'accountant'::app_role) OR has_role(auth.uid(), 'technician'::app_role) OR has_role(auth.uid(), 'client'::app_role));

-- Block anonymous access to employee_locations table
CREATE POLICY "Authenticated users only can access employee_locations"
ON public.employee_locations
FOR ALL
TO authenticated
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));