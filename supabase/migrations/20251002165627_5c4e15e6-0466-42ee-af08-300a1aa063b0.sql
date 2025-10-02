-- Add PII access audit logging table
CREATE TABLE IF NOT EXISTS public.pii_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscriber_id uuid NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  accessed_fields text[] NOT NULL,
  access_type text NOT NULL CHECK (access_type IN ('view', 'edit', 'export')),
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pii_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view PII access logs
CREATE POLICY "Admins can view PII access logs"
ON public.pii_access_logs FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert PII access logs
CREATE POLICY "System can insert PII access logs"
ON public.pii_access_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Prevent tampering
CREATE POLICY "Prevent PII log updates"
ON public.pii_access_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent PII log deletion"
ON public.pii_access_logs FOR DELETE
TO authenticated
USING (false);

-- Add indexes for performance
CREATE INDEX idx_pii_access_logs_subscriber ON public.pii_access_logs(subscriber_id);
CREATE INDEX idx_pii_access_logs_user ON public.pii_access_logs(user_id);
CREATE INDEX idx_pii_access_logs_created ON public.pii_access_logs(created_at DESC);

-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only authenticated service can manage reset tokens
CREATE POLICY "Service can manage reset tokens"
ON public.password_reset_tokens FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_password_reset_tokens_hash ON public.password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires ON public.password_reset_tokens(expires_at);

-- Add rate limiting table for password resets
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- email or IP
  attempt_type text NOT NULL CHECK (attempt_type IN ('password_reset', 'login', 'signup')),
  attempts integer DEFAULT 1,
  first_attempt_at timestamp with time zone DEFAULT now(),
  last_attempt_at timestamp with time zone DEFAULT now(),
  blocked_until timestamp with time zone
);

ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage rate limits"
ON public.rate_limit_attempts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_attempts(identifier, attempt_type);

-- Enhance geofence_zones with notification settings
ALTER TABLE public.geofence_zones 
ADD COLUMN IF NOT EXISTS notify_on_enter boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_exit boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_message text;

-- Add geofence events log
CREATE TABLE IF NOT EXISTS public.geofence_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  zone_id uuid NOT NULL REFERENCES public.geofence_zones(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('enter', 'exit')),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.geofence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view geofence events"
ON public.geofence_events FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their geofence events"
ON public.geofence_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert geofence events"
ON public.geofence_events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_geofence_events_user ON public.geofence_events(user_id);
CREATE INDEX idx_geofence_events_zone ON public.geofence_events(zone_id);
CREATE INDEX idx_geofence_events_created ON public.geofence_events(created_at DESC);