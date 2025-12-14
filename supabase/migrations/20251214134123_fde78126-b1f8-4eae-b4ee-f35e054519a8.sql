-- Create inventory movements table
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  notes TEXT,
  reference_number TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage inventory movements"
ON public.inventory_movements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accountants can view inventory movements"
ON public.inventory_movements
FOR SELECT
USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "System can insert movements"
ON public.inventory_movements
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_inventory_movements_inventory_id ON public.inventory_movements(inventory_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);