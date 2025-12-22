-- Create agents table for dealer/agent information
CREATE TABLE public.agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  telegram TEXT,
  region TEXT NOT NULL,
  address TEXT,
  working_hours TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add agent_id to subscribers to link customers to their agents
ALTER TABLE public.subscribers ADD COLUMN agent_id UUID REFERENCES public.agents(id);

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents
CREATE POLICY "Admins can manage agents"
ON public.agents FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents are publicly viewable"
ON public.agents FOR SELECT
USING (active = true);

-- Add index for performance
CREATE INDEX idx_subscribers_agent_id ON public.subscribers(agent_id);
CREATE INDEX idx_agents_region ON public.agents(region);
CREATE INDEX idx_agents_active ON public.agents(active);

-- Trigger to update updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();