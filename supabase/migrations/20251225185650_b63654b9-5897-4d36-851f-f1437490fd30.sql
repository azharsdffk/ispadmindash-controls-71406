-- Make work-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'work-photos';

-- Create RLS policies for work-photos bucket
-- First, drop any existing policies on storage.objects for this bucket
DO $$
BEGIN
  -- Drop policies if they exist
  DROP POLICY IF EXISTS "Admins can view all work photos" ON storage.objects;
  DROP POLICY IF EXISTS "Technicians can upload work photos" ON storage.objects;
  DROP POLICY IF EXISTS "Technicians can view own work photos" ON storage.objects;
  DROP POLICY IF EXISTS "Users can view work photos for their tickets" ON storage.objects;
END $$;

-- Admins can view all work photos
CREATE POLICY "Admins can view all work photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Technicians can upload their own work photos
CREATE POLICY "Technicians can upload work photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Technicians can view their own uploaded photos
CREATE POLICY "Technicians can view own work photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Technicians can update their own photos
CREATE POLICY "Technicians can update own work photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Technicians can delete their own photos
CREATE POLICY "Technicians can delete own work photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'work-photos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);