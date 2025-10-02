-- Add location fields to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS address_notes TEXT;

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_subscribers_location ON public.subscribers(latitude, longitude);

-- Add username field to profiles for employee login
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create employees table for better employee management
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  employee_code TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  position TEXT,
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Admins can manage employees
CREATE POLICY "Admins can manage employees"
ON public.employees
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Employees can view their own data
CREATE POLICY "Employees can view their own data"
ON public.employees
FOR SELECT
USING (auth.uid() = user_id);

-- Create location tracking settings table
CREATE TABLE IF NOT EXISTS public.location_tracking_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tracking_enabled BOOLEAN DEFAULT true,
  update_interval_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on location tracking settings
ALTER TABLE public.location_tracking_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own settings
CREATE POLICY "Users can manage their own tracking settings"
ON public.location_tracking_settings
FOR ALL
USING (auth.uid() = user_id);

-- Admins can view all settings
CREATE POLICY "Admins can view all tracking settings"
ON public.location_tracking_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create data import logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  import_type TEXT NOT NULL,
  records_imported INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on import logs
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage import logs
CREATE POLICY "Admins can manage import logs"
ON public.import_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at on employees
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on location_tracking_settings
CREATE TRIGGER update_location_tracking_settings_updated_at
BEFORE UPDATE ON public.location_tracking_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();