-- Add agent_id to maintenance_tickets for direct agent assignment
ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id);

-- Create index for faster agent queries
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_agent_id ON public.maintenance_tickets(agent_id);

-- Create function to auto-assign agent from subscriber when creating ticket
CREATE OR REPLACE FUNCTION public.auto_assign_agent_to_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If agent_id is not set, get it from the subscriber
  IF NEW.agent_id IS NULL THEN
    SELECT agent_id INTO NEW.agent_id
    FROM public.subscribers
    WHERE id = NEW.subscriber_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign agent
DROP TRIGGER IF EXISTS auto_assign_agent_trigger ON public.maintenance_tickets;
CREATE TRIGGER auto_assign_agent_trigger
  BEFORE INSERT ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_agent_to_ticket();

-- RLS policy for agents to view their tickets
CREATE POLICY "Agents can view their assigned tickets"
ON public.maintenance_tickets
FOR SELECT
USING (
  agent_id IN (
    SELECT id FROM public.agents WHERE id = agent_id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- RLS policy for agents to update tickets (assign technician)
CREATE POLICY "Agents can update their tickets"
ON public.maintenance_tickets
FOR UPDATE
USING (
  agent_id IN (
    SELECT id FROM public.agents WHERE id = agent_id
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create notifications function for ticket events
CREATE OR REPLACE FUNCTION public.notify_on_ticket_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_agent_user_id uuid;
  v_technician_user_id uuid;
  v_subscriber_name text;
BEGIN
  -- Get subscriber name
  SELECT name INTO v_subscriber_name FROM public.subscribers WHERE id = NEW.subscriber_id;
  
  -- On new ticket creation
  IF TG_OP = 'INSERT' THEN
    -- Notify admin users about new ticket
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    SELECT ur.user_id, 
           'طلب صيانة جديد',
           'طلب جديد من العميل: ' || COALESCE(v_subscriber_name, 'غير معروف'),
           'ticket',
           '/maintenance'
    FROM public.user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  
  -- On technician assignment
  IF TG_OP = 'UPDATE' AND OLD.technician_id IS DISTINCT FROM NEW.technician_id AND NEW.technician_id IS NOT NULL THEN
    -- Notify technician
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.technician_id,
      'مهمة صيانة جديدة',
      'تم تعيينك لطلب صيانة للعميل: ' || COALESCE(v_subscriber_name, 'غير معروف'),
      'ticket',
      '/technician'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for ticket notifications
DROP TRIGGER IF EXISTS ticket_notification_trigger ON public.maintenance_tickets;
CREATE TRIGGER ticket_notification_trigger
  AFTER INSERT OR UPDATE ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_ticket_event();