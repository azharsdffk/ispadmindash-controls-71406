-- Fix Security Definer Views by setting SECURITY INVOKER
ALTER VIEW public.technicians_map_view SET (security_invoker = true);
ALTER VIEW public.subscribers_map_view SET (security_invoker = true);
ALTER VIEW public.tickets_map_view SET (security_invoker = true);