
-- Add MAC address field to subscribers table
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS mac_address TEXT,
ADD COLUMN IF NOT EXISTS mac_locked BOOLEAN DEFAULT false;

-- Add index for MAC address lookups
CREATE INDEX IF NOT EXISTS idx_subscribers_mac_address ON public.subscribers(mac_address);

-- Create a table to track MAC address history
CREATE TABLE IF NOT EXISTS public.mac_address_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  mac_address TEXT NOT NULL,
  action TEXT NOT NULL, -- 'added', 'removed', 'locked', 'unlocked'
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.mac_address_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for mac_address_history
CREATE POLICY "Admins can manage MAC history"
ON public.mac_address_history
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Technicians can view MAC history"
ON public.mac_address_history
FOR SELECT
USING (has_role(auth.uid(), 'technician'::app_role));

-- Add comment for documentation
COMMENT ON COLUMN public.subscribers.mac_address IS 'MAC address of the subscriber device';
COMMENT ON COLUMN public.subscribers.mac_locked IS 'Whether the subscriber is locked to this MAC address';
