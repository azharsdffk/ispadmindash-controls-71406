-- Drop existing views
DROP VIEW IF EXISTS public.public_packages;
DROP VIEW IF EXISTS public.technicians_public;

-- Recreate public_packages view without SECURITY DEFINER
CREATE VIEW public.public_packages AS
SELECT 
  id,
  name,
  name_en,
  description,
  speed_mbps,
  active
FROM public.packages
WHERE active = true;

-- Recreate technicians_public view without SECURITY DEFINER
CREATE VIEW public.technicians_public AS
SELECT 
  id,
  name,
  specialization,
  available
FROM public.technicians
WHERE available = true;

-- Enable RLS on views
ALTER VIEW public.public_packages SET (security_invoker = true);
ALTER VIEW public.technicians_public SET (security_invoker = true);

-- Grant SELECT to authenticated users
GRANT SELECT ON public.public_packages TO authenticated;
GRANT SELECT ON public.technicians_public TO authenticated;

-- Grant SELECT to anon users (since these are public views)
GRANT SELECT ON public.public_packages TO anon;
GRANT SELECT ON public.technicians_public TO anon;