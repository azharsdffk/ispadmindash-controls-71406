-- Create employee_location_access_logs table for audit trail
CREATE TABLE IF NOT EXISTS public.employee_location_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessor_id UUID NOT NULL,
  accessed_user_id UUID,
  access_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  query_type TEXT NOT NULL DEFAULT 'view',
  records_count INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.employee_location_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view location access logs
CREATE POLICY "Admins can view location access logs"
ON public.employee_location_access_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert location access logs
CREATE POLICY "System can insert location access logs"
ON public.employee_location_access_logs
FOR INSERT
WITH CHECK (true);

-- Prevent updates and deletes to maintain audit integrity
CREATE POLICY "Prevent location access log updates"
ON public.employee_location_access_logs
FOR UPDATE
USING (false);

CREATE POLICY "Prevent location access log deletion"
ON public.employee_location_access_logs
FOR DELETE
USING (false);

-- Create function to log location access
CREATE OR REPLACE FUNCTION public.log_employee_location_access(
  p_accessor_id UUID,
  p_accessed_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_query_type TEXT DEFAULT 'view',
  p_records_count INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.employee_location_access_logs (
    accessor_id,
    accessed_user_id,
    ip_address,
    user_agent,
    query_type,
    records_count,
    metadata
  ) VALUES (
    p_accessor_id,
    p_accessed_user_id,
    p_ip_address,
    p_user_agent,
    p_query_type,
    p_records_count,
    p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;

-- Create function to cleanup old location data (90 day retention)
CREATE OR REPLACE FUNCTION public.cleanup_old_location_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete location data older than 90 days
  DELETE FROM public.employee_locations
  WHERE recorded_at < NOW() - INTERVAL '90 days';
  
  -- Delete access logs older than 1 year
  DELETE FROM public.employee_location_access_logs
  WHERE access_timestamp < NOW() - INTERVAL '1 year';
END;
$$;