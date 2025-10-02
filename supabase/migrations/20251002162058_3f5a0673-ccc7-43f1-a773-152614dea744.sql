-- Fix CRITICAL security vulnerability in profiles table
-- Drop the dangerous policy that allows all authenticated users to see all profiles
DROP POLICY IF EXISTS "Authenticated users only can access profiles" ON public.profiles;

-- Drop old redundant policies if they exist
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Add secure policies for profiles table
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Prevent all profile deletions (profiles should only be deleted via cascade when user is deleted)
CREATE POLICY "Prevent profile deletion"
ON public.profiles FOR DELETE
TO authenticated
USING (false);

-- Fix audit_logs table to make logs immutable
-- Add policies to prevent tampering with audit logs
CREATE POLICY "Prevent audit log updates"
ON public.audit_logs FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Prevent audit log deletion"
ON public.audit_logs FOR DELETE
TO authenticated
USING (false);

CREATE POLICY "Allow audit log insertion"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);