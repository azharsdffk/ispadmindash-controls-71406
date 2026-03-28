
-- Function to auto-link subscriber to user on signup when subscription_number is provided
CREATE OR REPLACE FUNCTION public.auto_link_subscriber_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_subscription_number TEXT;
  v_subscriber_id UUID;
BEGIN
  -- Get subscription_number from user metadata
  v_subscription_number := NEW.raw_user_meta_data->>'subscription_number';
  
  IF v_subscription_number IS NOT NULL AND v_subscription_number != '' THEN
    -- Find subscriber by username (service ID)
    SELECT id INTO v_subscriber_id
    FROM public.subscribers
    WHERE username = v_subscription_number
    LIMIT 1;
    
    -- If not found by username, try by phone
    IF v_subscriber_id IS NULL THEN
      SELECT id INTO v_subscriber_id
      FROM public.subscribers
      WHERE phone = v_subscription_number
      LIMIT 1;
    END IF;
    
    -- If found, create the link
    IF v_subscriber_id IS NOT NULL THEN
      INSERT INTO public.subscriber_users (user_id, subscriber_id)
      VALUES (NEW.id, v_subscriber_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on auth.users (runs after handle_new_user)
DROP TRIGGER IF EXISTS on_auth_user_created_link_subscriber ON auth.users;
CREATE TRIGGER on_auth_user_created_link_subscriber
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_link_subscriber_on_signup();
