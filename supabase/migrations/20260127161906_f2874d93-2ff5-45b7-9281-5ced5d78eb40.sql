-- =====================================================
-- MAPBOX INTEGRATION: Database Schema Updates
-- =====================================================

-- 1. Add status field to technicians table
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'offline';

-- Add latitude/longitude if not exist
ALTER TABLE public.technicians 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_technicians_status ON public.technicians(status);

-- 2. Add location fields to maintenance_tickets
ALTER TABLE public.maintenance_tickets 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create spatial index for ticket locations
CREATE INDEX IF NOT EXISTS idx_tickets_location ON public.maintenance_tickets(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 3. Create a view for technician map data
CREATE OR REPLACE VIEW public.technicians_map_view AS
SELECT 
  t.id,
  t.name,
  t.phone,
  t.specialization,
  t.available,
  t.status,
  COALESCE(el.latitude, t.latitude) as latitude,
  COALESCE(el.longitude, t.longitude) as longitude,
  el.recorded_at as last_location_update,
  el.speed,
  el.heading,
  t.user_id
FROM public.technicians t
LEFT JOIN LATERAL (
  SELECT latitude, longitude, recorded_at, speed, heading
  FROM public.employee_locations
  WHERE user_id = t.user_id
  ORDER BY recorded_at DESC
  LIMIT 1
) el ON true;

-- 4. Create a view for subscribers/customers map data (without status column)
CREATE OR REPLACE VIEW public.subscribers_map_view AS
SELECT 
  id,
  name,
  phone,
  address,
  latitude,
  longitude,
  agent_id
FROM public.subscribers
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 5. Create a view for tickets map data
CREATE OR REPLACE VIEW public.tickets_map_view AS
SELECT 
  mt.id,
  mt.ticket_number,
  mt.issue_description,
  mt.priority,
  mt.status,
  mt.scheduled_date,
  COALESCE(mt.latitude, s.latitude) as latitude,
  COALESCE(mt.longitude, s.longitude) as longitude,
  mt.location_address,
  s.name as subscriber_name,
  s.phone as subscriber_phone,
  s.address as subscriber_address,
  t.name as technician_name,
  mt.technician_id,
  mt.created_at
FROM public.maintenance_tickets mt
LEFT JOIN public.subscribers s ON mt.subscriber_id = s.id
LEFT JOIN public.technicians t ON mt.technician_id = t.id;

-- 6. Function to calculate distance using Haversine formula
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  R DECIMAL := 6371;
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := RADIANS(lat2 - lat1);
  dLon := RADIANS(lon2 - lon1);
  a := SIN(dLat/2) * SIN(dLat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dLon/2) * SIN(dLon/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 7. Function to find nearest available technician
CREATE OR REPLACE FUNCTION public.find_nearest_technician(
  target_lat DECIMAL,
  target_lng DECIMAL,
  max_distance_km DECIMAL DEFAULT 50
) RETURNS TABLE (
  technician_id UUID,
  technician_name TEXT,
  phone TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  distance_km DECIMAL,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tmv.id,
    tmv.name,
    tmv.phone,
    tmv.latitude,
    tmv.longitude,
    public.calculate_distance(target_lat, target_lng, tmv.latitude, tmv.longitude) as distance_km,
    tmv.status
  FROM public.technicians_map_view tmv
  WHERE tmv.available = true
    AND tmv.status IN ('online', 'available')
    AND tmv.latitude IS NOT NULL
    AND tmv.longitude IS NOT NULL
    AND public.calculate_distance(target_lat, target_lng, tmv.latitude, tmv.longitude) <= max_distance_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 8. Grant access to authenticated users
GRANT SELECT ON public.technicians_map_view TO authenticated;
GRANT SELECT ON public.subscribers_map_view TO authenticated;
GRANT SELECT ON public.tickets_map_view TO authenticated;

-- 9. Create index for technician user_id lookups
CREATE INDEX IF NOT EXISTS idx_technicians_user_id ON public.technicians(user_id);

-- 10. Add trigger to update technician status based on location activity
CREATE OR REPLACE FUNCTION public.update_technician_status_on_location()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.technicians 
  SET status = 'online'
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_update_tech_status_on_location ON public.employee_locations;
CREATE TRIGGER trg_update_tech_status_on_location
AFTER INSERT ON public.employee_locations
FOR EACH ROW
EXECUTE FUNCTION public.update_technician_status_on_location();