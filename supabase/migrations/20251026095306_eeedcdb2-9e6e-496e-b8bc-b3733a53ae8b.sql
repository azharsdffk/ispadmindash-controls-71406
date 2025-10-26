-- Add issue_type column to maintenance_tickets table
ALTER TABLE public.maintenance_tickets
ADD COLUMN issue_type TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.maintenance_tickets.issue_type IS 'نوع المشكلة أو سبب الصيانة';