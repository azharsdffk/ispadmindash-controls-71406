-- Fix: audit trigger should log deletions BEFORE the subscriber row is removed (avoids FK violation)

-- Drop old trigger that logs DELETE after the row is gone
DROP TRIGGER IF EXISTS trigger_log_subscriber_changes ON public.subscribers;

-- Create trigger for INSERT/UPDATE (keep as AFTER)
CREATE TRIGGER trigger_log_subscriber_changes_aiu
AFTER INSERT OR UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.log_subscriber_changes();

-- Create trigger for DELETE (log BEFORE delete so subscriber_id is valid at insert time)
CREATE TRIGGER trigger_log_subscriber_changes_bd
BEFORE DELETE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.log_subscriber_changes();
