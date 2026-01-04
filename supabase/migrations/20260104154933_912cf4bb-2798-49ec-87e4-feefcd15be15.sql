-- Allow clients to search for subscribers by username or phone (to link their account)
CREATE POLICY "Clients can search subscribers to link account" 
ON public.subscribers 
FOR SELECT 
TO authenticated
USING (
  has_role(auth.uid(), 'client'::app_role)
);