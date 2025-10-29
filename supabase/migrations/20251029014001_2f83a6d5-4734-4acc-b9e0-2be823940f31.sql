-- إصلاح عمود net_amount ليكون محسوباً تلقائياً
ALTER TABLE public.invoices 
DROP COLUMN IF EXISTS net_amount;

ALTER TABLE public.invoices 
ADD COLUMN net_amount NUMERIC GENERATED ALWAYS AS (amount - COALESCE(discount, 0)) STORED;