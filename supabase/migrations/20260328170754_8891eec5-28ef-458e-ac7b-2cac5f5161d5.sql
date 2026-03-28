
-- Auto-assign nearest available technician when a ticket is created
CREATE OR REPLACE FUNCTION public.assign_nearest_technician_to_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tech_id uuid;
  v_tech_user_id uuid;
BEGIN
  -- Only run if no technician assigned and ticket has coordinates
  IF NEW.technician_id IS NOT NULL OR NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find nearest available technician
  SELECT t.id, t.user_id INTO v_tech_id, v_tech_user_id
  FROM public.technicians t
  WHERE t.available = true
    AND t.status IN ('online', 'available')
    AND t.latitude IS NOT NULL
    AND t.longitude IS NOT NULL
  ORDER BY public.calculate_distance(
    NEW.latitude, NEW.longitude, t.latitude, t.longitude
  ) ASC
  LIMIT 1;

  IF v_tech_id IS NOT NULL THEN
    NEW.technician_id := v_tech_id;
    NEW.status := 'tech_assigned';
    
    -- Notify the technician
    INSERT INTO public.notifications (user_id, title, message, type, action_url)
    VALUES (
      v_tech_user_id,
      'طلب صيانة جديد - تعيين تلقائي',
      'تم تعيينك تلقائياً لطلب صيانة جديد رقم ' || COALESCE(NEW.ticket_number, ''),
      'ticket',
      '/technician'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trigger_assign_nearest_tech ON public.maintenance_tickets;

-- Create trigger on INSERT
CREATE TRIGGER trigger_assign_nearest_tech
  BEFORE INSERT ON public.maintenance_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_nearest_technician_to_ticket();
