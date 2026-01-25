-- Add heading and speed columns to employee_locations for better tracking
ALTER TABLE public.employee_locations 
ADD COLUMN IF NOT EXISTS heading numeric,
ADD COLUMN IF NOT EXISTS speed numeric;

-- Create index for faster queries on recent locations
CREATE INDEX IF NOT EXISTS idx_employee_locations_user_recorded 
ON public.employee_locations(user_id, recorded_at DESC);

-- Create index for realtime queries
CREATE INDEX IF NOT EXISTS idx_employee_locations_recorded_at 
ON public.employee_locations(recorded_at DESC);