-- Add new columns to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS phone_secondary TEXT,
ADD COLUMN IF NOT EXISTS status_comment TEXT;

-- Add comment to explain columns
COMMENT ON COLUMN public.subscribers.username IS 'اسم المستخدم للمشترك';
COMMENT ON COLUMN public.subscribers.phone_secondary IS 'رقم الهاتف الثاني للمشترك';
COMMENT ON COLUMN public.subscribers.status_comment IS 'التعليق على حالة المشترك';

-- Insert default packages if they don't exist
INSERT INTO public.packages (name, name_en, speed_mbps, monthly_price, currency, description, active, features)
VALUES 
  ('باقة 50 ميجابايت', '50MB Package', 50, 30000, 'IQD', 'باقة انترنت بسرعة 50 ميجابايت في الثانية', true, '["سرعة 50 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام"]'::jsonb),
  ('باقة 100 ميجابايت', '100MB Package', 100, 50000, 'IQD', 'باقة انترنت بسرعة 100 ميجابايت في الثانية', true, '["سرعة 100 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام", "أولوية في الصيانة"]'::jsonb),
  ('باقة 150 ميجابايت', '150MB Package', 150, 70000, 'IQD', 'باقة انترنت بسرعة 150 ميجابايت في الثانية', true, '["سرعة 150 ميجابايت", "دعم فني 24/7", "بدون حد للاستخدام", "أولوية في الصيانة", "IP ثابت"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Create subscriber_audit_trail table for detailed audit logging
CREATE TABLE IF NOT EXISTS public.subscriber_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES public.subscribers(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on subscriber_audit_trail
ALTER TABLE public.subscriber_audit_trail ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriber_audit_trail
CREATE POLICY "Admins can view all audit trails"
ON public.subscriber_audit_trail
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit trails"
ON public.subscriber_audit_trail
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Prevent audit trail updates"
ON public.subscriber_audit_trail
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent audit trail deletion"
ON public.subscriber_audit_trail
FOR DELETE
TO authenticated
USING (false);

-- Create index for faster audit trail queries
CREATE INDEX IF NOT EXISTS idx_subscriber_audit_trail_subscriber_id 
ON public.subscriber_audit_trail(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_subscriber_audit_trail_changed_at 
ON public.subscriber_audit_trail(changed_at DESC);

-- Create function to log subscriber changes
CREATE OR REPLACE FUNCTION public.log_subscriber_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log name changes
    IF OLD.name IS DISTINCT FROM NEW.name THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'name', OLD.name, NEW.name, auth.uid());
    END IF;
    
    -- Log phone changes
    IF OLD.phone IS DISTINCT FROM NEW.phone THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'phone', OLD.phone, NEW.phone, auth.uid());
    END IF;
    
    -- Log username changes
    IF OLD.username IS DISTINCT FROM NEW.username THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'username', OLD.username, NEW.username, auth.uid());
    END IF;
    
    -- Log plan changes
    IF OLD.plan IS DISTINCT FROM NEW.plan THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'plan', OLD.plan, NEW.plan, auth.uid());
    END IF;
    
    -- Log balance changes
    IF OLD.balance IS DISTINCT FROM NEW.balance THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'balance', OLD.balance::TEXT, NEW.balance::TEXT, auth.uid());
    END IF;
    
    -- Log status comment changes
    IF OLD.status_comment IS DISTINCT FROM NEW.status_comment THEN
      INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, new_value, changed_by)
      VALUES (NEW.id, 'UPDATE', 'status_comment', OLD.status_comment, NEW.status_comment, auth.uid());
    END IF;
    
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, new_value, changed_by)
    VALUES (NEW.id, 'INSERT', 'created', 'New subscriber created', auth.uid());
    
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO subscriber_audit_trail (subscriber_id, action, field_name, old_value, changed_by)
    VALUES (OLD.id, 'DELETE', 'deleted', 'Subscriber deleted', auth.uid());
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for subscriber changes
DROP TRIGGER IF EXISTS trigger_log_subscriber_changes ON public.subscribers;
CREATE TRIGGER trigger_log_subscriber_changes
AFTER INSERT OR UPDATE OR DELETE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.log_subscriber_changes();