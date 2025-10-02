-- Fix employees table foreign key relationship
-- Add foreign key to profiles table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'employees_user_id_fkey' 
    AND table_name = 'employees'
  ) THEN
    ALTER TABLE public.employees 
    ADD CONSTRAINT employees_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;