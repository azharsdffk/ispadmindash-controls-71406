-- Drop the security definer view that was flagged
DROP VIEW IF EXISTS public.subscribers_with_logging;

-- Remove the unused trigger function
DROP FUNCTION IF EXISTS public.log_subscriber_view();