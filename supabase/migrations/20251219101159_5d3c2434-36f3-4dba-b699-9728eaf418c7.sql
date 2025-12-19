-- Fix: Allow subscriber_audit_trail to keep records even after subscriber is deleted
-- Change the foreign key to SET NULL on delete instead of CASCADE or RESTRICT

ALTER TABLE public.subscriber_audit_trail 
DROP CONSTRAINT IF EXISTS subscriber_audit_trail_subscriber_id_fkey;

-- Make subscriber_id nullable to allow keeping audit records after subscriber deletion
ALTER TABLE public.subscriber_audit_trail 
ALTER COLUMN subscriber_id DROP NOT NULL;

-- Re-add the foreign key with ON DELETE SET NULL
ALTER TABLE public.subscriber_audit_trail
ADD CONSTRAINT subscriber_audit_trail_subscriber_id_fkey 
FOREIGN KEY (subscriber_id) 
REFERENCES public.subscribers(id) 
ON DELETE SET NULL;