-- Create user_security_settings table if not exists (for storing 2FA preferences)
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  allow_multiple_sessions BOOLEAN DEFAULT true,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can update their own security settings" ON public.user_security_settings;
DROP POLICY IF EXISTS "Users can insert their own security settings" ON public.user_security_settings;

-- Create policies
CREATE POLICY "Users can view their own security settings"
ON public.user_security_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
ON public.user_security_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own security settings"
ON public.user_security_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_security_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trigger_update_user_security_settings ON public.user_security_settings;
CREATE TRIGGER trigger_update_user_security_settings
BEFORE UPDATE ON public.user_security_settings
FOR EACH ROW
EXECUTE FUNCTION update_user_security_settings_updated_at();